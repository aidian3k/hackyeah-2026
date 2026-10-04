#!/usr/bin/env bash
# Wdrożenie backendu HubMI na AWS: jedna EC2, Docker (pgvector/pg16 + FastAPI) — chore-2026-10-04-1.
# Uruchamiasz z laptopa, z dowolnego katalogu. Wymaga: aws CLI (zalogowane), ssh, scp, git, tar, curl.
#
#   deploy/aws/backend.sh all       # infra + setup + deploy (+ seed przy pustej bazie) — pierwsze wdrożenie
#   deploy/aws/backend.sh deploy    # kolejne wdrożenia: wyślij kod i .env, przebuduj api
#   deploy/aws/backend.sh seed      # ingest + seedy (idempotentne, ingest kosztuje wywołania OpenAI)
#   deploy/aws/backend.sh status | logs | ssh
#   deploy/aws/backend.sh destroy   # usuwa instancję, Elastic IP, security group i key pair (z potwierdzeniem)
#
# Zmienne (opcjonalne): AWS_PROFILE, AWS_REGION (eu-central-1), NAME (hubmi), INSTANCE_TYPE (t3.small),
# DISK_GB (20), ENV_FILE (.env.aws), HTTPS=1 (Caddy na 80/443, domena API_DOMAIN albo <ip>.sslip.io).
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

allow_port() { # sg port cidr opis
  aws ec2 authorize-security-group-ingress --group-id "$1" \
    --ip-permissions "IpProtocol=tcp,FromPort=$2,ToPort=$2,IpRanges=[{CidrIp=$3,Description=$4}]" \
    >/dev/null 2>&1 || true   # reguła już istnieje
}

# ---------- infra: key pair, security group, instancja, Elastic IP ----------

cmd_infra() {
  aws sts get-caller-identity >/dev/null 2>&1 || die "aws CLI niezalogowane (aws configure / AWS_PROFILE)"
  log "Region $AWS_REGION, nazwa $NAME"

  if aws ec2 describe-key-pairs --key-names "$KEY_NAME" >/dev/null 2>&1; then
    [ -f "$KEY_FILE" ] || die "key pair $KEY_NAME istnieje w AWS, ale brak $KEY_FILE (usuń go w konsoli albo podłóż plik)"
    log "Key pair $KEY_NAME: jest"
  else
    log "Tworzę key pair $KEY_NAME → $KEY_FILE"
    aws ec2 create-key-pair --key-name "$KEY_NAME" --key-type ed25519 \
      --query KeyMaterial --output text > "$KEY_FILE"
    chmod 400 "$KEY_FILE"
  fi

  local vpc sg my_ip
  vpc="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
  [ "$vpc" != "None" ] || die "brak domyślnego VPC w $AWS_REGION"
  sg="$(sg_id)"
  if [ -z "$sg" ]; then
    log "Tworzę security group $SG_NAME"
    sg="$(aws ec2 create-security-group --group-name "$SG_NAME" --description "HubMI API" \
      --vpc-id "$vpc" --query GroupId --output text)"
  fi
  my_ip="$(curl -fsS https://checkip.amazonaws.com | tr -d '[:space:]')"
  allow_port "$sg" 22 "$my_ip/32" "ssh"
  if api_locked_down; then
    log "Security group $sg: 22 z $my_ip, 8000 tylko z CloudFront (frontend.sh lockdown)"
  else
    log "Security group $sg: 22 z $my_ip, 8000 z internetu"
    allow_port "$sg" 8000 "0.0.0.0/0" "api"
  fi
  if [ "$HTTPS" = 1 ]; then
    log "Security group $sg: 80/443 z internetu (Caddy)"
    allow_port "$sg" 80 "0.0.0.0/0" "acme"
    allow_port "$sg" 443 "0.0.0.0/0" "https"
  fi

  local iid
  iid="$(instance_id)"
  if [ -z "$iid" ]; then
    local ami
    ami="$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
      --query Parameter.Value --output text)"
    log "Tworzę instancję $INSTANCE_TYPE (AMI $ami, dysk ${DISK_GB} GB)"
    iid="$(aws ec2 run-instances --image-id "$ami" --instance-type "$INSTANCE_TYPE" \
      --key-name "$KEY_NAME" --security-group-ids "$sg" \
      --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=$DISK_GB,VolumeType=gp3}" \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$TAG}]" \
      --query 'Instances[0].InstanceId' --output text)"
  else
    log "Instancja $iid: jest"
    aws ec2 start-instances --instance-ids "$iid" >/dev/null 2>&1 || true
  fi
  log "Czekam, aż $iid będzie running…"
  aws ec2 wait instance-running --instance-ids "$iid"

  local alloc
  alloc="$(eip_alloc)"
  if [ -z "$alloc" ]; then
    log "Przydzielam Elastic IP"
    alloc="$(aws ec2 allocate-address --domain vpc \
      --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=$TAG-eip}]" \
      --query AllocationId --output text)"
  fi
  aws ec2 associate-address --instance-id "$iid" --allocation-id "$alloc" >/dev/null
  log "Elastic IP: $(public_ip)"
}

# ---------- setup: Docker, compose, buildx, swap ----------

wait_ssh() {
  log "Czekam na SSH…"
  for _ in $(seq 1 40); do
    rssh true 2>/dev/null && return 0
    sleep 5
  done
  die "SSH nie odpowiada na $(public_ip) (security group: port 22 z Twojego IP?)"
}

cmd_setup() {
  wait_ssh
  log "Instaluję Dockera, compose, buildx i swap (idempotentnie)"
  rssh 'bash -s' <<'REMOTE'
set -euo pipefail
if ! command -v docker >/dev/null; then
  sudo dnf install -y -q docker tar
  sudo systemctl enable --now docker
  sudo usermod -aG docker ec2-user
fi
P=/usr/local/lib/docker/cli-plugins
sudo mkdir -p "$P"
latest() { curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/docker/$1/releases/latest" | sed 's#.*/##'; }
# compose >= 2.24 (składnia !reset w docker-compose.aws.yml)
DCV="$(sudo docker compose version --short 2>/dev/null | sed 's/^v//')"
if [ -z "$DCV" ] || [ "$(printf '%s\n2.24.0\n' "$DCV" | sort -V | head -1)" != "2.24.0" ]; then
  sudo curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o "$P/docker-compose"
  sudo chmod +x "$P/docker-compose"
fi
# AL2023 ma w paczce docker stary buildx (< 0.17), a compose build wymaga >= 0.17.
# /usr/local/lib/docker/cli-plugins ma pierwszeństwo przed /usr/libexec/docker/cli-plugins z paczki.
BX="$(sudo docker buildx version 2>/dev/null | awk '{print $2}' | sed 's/^v//')"
if [ -z "$BX" ] || [ "$(printf '%s\n0.17.0\n' "$BX" | sort -V | head -1)" != "0.17.0" ]; then
  V="$(latest buildx)"
  sudo curl -fsSL "https://github.com/docker/buildx/releases/download/$V/buildx-$V.linux-amd64" -o "$P/docker-buildx"
  sudo chmod +x "$P/docker-buildx"
fi
if ! swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile && sudo mkswap /swapfile >/dev/null && sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
sudo docker compose version && sudo docker buildx version
REMOTE
}

# ---------- deploy: kod + .env → docker compose up ----------

cmd_deploy() {
  [ -f "$ENV_FILE" ] || die "brak $ENV_FILE — utwórz: cp .env .env.aws (klucze OpenAI/Cohere, CORS_ORIGINS)"
  wait_ssh
  local ip; ip="$(public_ip)"

  log "Wysyłam kod (pliki z gita + nieśledzone nieignorowane, bez docs/)"
  ( cd "$REPO_ROOT"
    git ls-files -z -co --exclude-standard -- . ':!docs' ':!deploy/aws/*.pem' |
      while IFS= read -r -d '' f; do [ -f "$f" ] && printf '%s\0' "$f"; done |
      COPYFILE_DISABLE=1 tar --null -T - -czf -
  ) | rssh "mkdir -p ~/$REMOTE_DIR && tar xzf - -C ~/$REMOTE_DIR --warning=no-unknown-keyword"

  log "Wysyłam $(basename "$ENV_FILE") jako .env"
  # shellcheck disable=SC2046
  scp -q $(ssh_opts) "$ENV_FILE" "ec2-user@$ip:$REMOTE_DIR/.env"

  local services="db api" api_domain="${API_DOMAIN:-$(echo "$ip" | tr . -).sslip.io}"
  [ "$HTTPS" = 1 ] && services="db api caddy"
  log "docker compose up -d --build $services"
  rssh "cd ~/$REMOTE_DIR && API_DOMAIN=$api_domain $DC up -d --build --remove-orphans $services"

  log "Czekam na /healthz…"
  rssh 'for i in $(seq 1 60); do curl -fsS localhost:8000/healthz >/dev/null 2>&1 && exit 0; sleep 2; done; exit 1' \
    || die "api nie odpowiada — sprawdź: $0 logs"
  log "Backend działa: http://$ip:8000/healthz"
  [ "$HTTPS" = 1 ] && log "HTTPS (po wystawieniu certyfikatu): https://$api_domain/healthz"
  return 0
}

# ---------- seed: ingest + dane demo ----------

cmd_seed() {
  log "Ingest i seedy (kolejność ma znaczenie: seedy szukają rozwiązań po tytule)"
  rssh "cd ~/$REMOTE_DIR && set -e
    $DC exec -T api python -m scripts.ingest data/solutions/
    $DC exec -T api python -m scripts.ingest data/knowledge/records/
    $DC exec -T api python -m scripts.ingest_knowledge data/knowledge/
    $DC exec -T api python -m scripts.seed_reports
    $DC exec -T api python -m scripts.seed_ideas
    $DC exec -T api python -m scripts.seed_innovation_tests
    $DC exec -T api python -m scripts.seed_comm"
}

solutions_count() {
  rssh "cd ~/$REMOTE_DIR && $DC exec -T db psql -U splot -d splot -tAc 'SELECT count(*) FROM solutions'" | tr -d '[:space:]'
}

# ---------- reszta ----------

cmd_status() {
  local iid; iid="$(instance_id)"
  [ -n "$iid" ] || { echo "Brak instancji $TAG w $AWS_REGION."; return 0; }
  echo "Instancja: $iid ($(aws ec2 describe-instances --instance-ids "$iid" \
    --query 'Reservations[0].Instances[0].[State.Name,PublicDnsName]' --output text))"
  echo "IP:        $(public_ip)"
  echo "API:       http://$(public_ip):8000/healthz"
  rssh "cd ~/$REMOTE_DIR 2>/dev/null && $DC ps" || true
}

cmd_destroy() {
  local iid alloc sg
  iid="$(instance_id)"; alloc="$(eip_alloc)"; sg="$(sg_id)"
  echo "Usunę w $AWS_REGION: instancję ${iid:-–} (z bazą na dysku!), Elastic IP ${alloc:-–}, SG ${sg:-–}, key pair $KEY_NAME."
  read -r -p "Wpisz nazwę ($NAME), żeby potwierdzić: " answer
  [ "$answer" = "$NAME" ] || die "przerwano"
  if [ -n "$alloc" ]; then
    local assoc
    assoc="$(aws ec2 describe-addresses --allocation-ids "$alloc" --query 'Addresses[0].AssociationId' --output text)"
    [ "$assoc" != "None" ] && aws ec2 disassociate-address --association-id "$assoc"
    aws ec2 release-address --allocation-id "$alloc"
  fi
  if [ -n "$iid" ]; then
    aws ec2 terminate-instances --instance-ids "$iid" >/dev/null
    log "Czekam na usunięcie instancji…"
    aws ec2 wait instance-terminated --instance-ids "$iid"
  fi
  [ -n "$sg" ] && aws ec2 delete-security-group --group-id "$sg"
  aws ec2 delete-key-pair --key-name "$KEY_NAME" >/dev/null 2>&1 || true
  rm -f "$KEY_FILE" "$KNOWN_HOSTS"
  log "Usunięte."
}

case "${1:-}" in
  infra)   cmd_infra ;;
  setup)   cmd_setup ;;
  deploy)  cmd_deploy ;;
  seed)    cmd_seed ;;
  all)
    cmd_infra; cmd_setup; cmd_deploy
    if [ "$(solutions_count)" = "0" ]; then cmd_seed; else log "Baza ma dane — pomijam seed (ręcznie: $0 seed)"; fi
    cmd_status ;;
  status)  cmd_status ;;
  logs)    rssh "cd ~/$REMOTE_DIR && $DC logs -f --tail=200 ${2:-api}" ;;
  # shellcheck disable=SC2046
  ssh)     shift; ssh -t $(ssh_opts) "ec2-user@$(public_ip)" "$@" ;;
  destroy) cmd_destroy ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
