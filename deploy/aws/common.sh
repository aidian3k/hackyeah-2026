# Wspólna konfiguracja i funkcje skryptów deploy/aws/*.sh (chore-2026-10-04-1). Nie uruchamiaj bezpośrednio.
# Zasoby AWS są znajdowane po nazwach i tagach — bez pliku stanu.
# shellcheck shell=bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/deploy/aws"

export AWS_REGION="${AWS_REGION:-eu-central-1}"
export AWS_DEFAULT_REGION="$AWS_REGION"
export AWS_PAGER=""
NAME="${NAME:-hubmi}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.small}"
DISK_GB="${DISK_GB:-20}"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.aws}"
HTTPS="${HTTPS:-0}"

KEY_NAME="$NAME-key"
KEY_FILE="$HERE/$KEY_NAME.pem"
SG_NAME="$NAME-api-sg"
TAG="$NAME-api"
REMOTE_DIR="hubmi"
KNOWN_HOSTS="$HERE/known_hosts"
DC="docker compose -p $NAME -f docker-compose.yml -f docker-compose.aws.yml"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mBłąd:\033[0m %s\n' "$*" >&2; exit 1; }

# ---------- zapytania o stan (bez pliku stanu: wszystko po nazwach i tagach) ----------

instance_id() {
  aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$TAG" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query 'Reservations[].Instances[0].InstanceId' --output text | awk '{print $1}' | grep -v '^None$' || true
}

eip_alloc() {
  aws ec2 describe-addresses --filters "Name=tag:Name,Values=$TAG-eip" \
    --query 'Addresses[0].AllocationId' --output text | grep -v '^None$' || true
}

public_ip() {
  local alloc; alloc="$(eip_alloc)"
  [ -n "$alloc" ] || die "brak Elastic IP — uruchom najpierw: $0 infra"
  aws ec2 describe-addresses --allocation-ids "$alloc" --query 'Addresses[0].PublicIp' --output text
}

sg_id() {
  aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' --output text | grep -v '^None$' || true
}

ssh_opts() {
  echo "-i $KEY_FILE -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$KNOWN_HOSTS -o ConnectTimeout=10 -o ServerAliveInterval=30"
}

# shellcheck disable=SC2046
rssh() { ssh $(ssh_opts) "ec2-user@$(public_ip)" "$@"; }

# EC2 publiczna nazwa DNS (CloudFront wymaga domeny, nie IP); po podpięciu EIP wskazuje na EIP.
public_dns() {
  local iid; iid="$(instance_id)"
  [ -n "$iid" ] || die "brak instancji $TAG — uruchom najpierw: deploy/aws/backend.sh all"
  aws ec2 describe-instances --instance-ids "$iid" \
    --query 'Reservations[0].Instances[0].PublicDnsName' --output text
}

# Zarządzana lista adresów CloudFront (origin-facing) — do zawężenia portu 8000.
cf_prefix_list() {
  aws ec2 describe-managed-prefix-lists \
    --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing \
    --query 'PrefixLists[0].PrefixListId' --output text
}

# 1, gdy port 8000 jest już zawężony do CloudFront (frontend.sh lockdown).
api_locked_down() {
  local sg; sg="$(sg_id)"
  [ -n "$sg" ] || return 1
  aws ec2 describe-security-groups --group-ids "$sg" \
    --query 'SecurityGroups[0].IpPermissions[?FromPort==`8000`].PrefixListIds[].PrefixListId' --output text |
    grep -q pl-
}
