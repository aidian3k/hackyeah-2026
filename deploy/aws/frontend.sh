#!/usr/bin/env bash
# Frontend HubMI na AWS: prywatny S3 + CloudFront (HTTPS), /api/* i /healthz → EC2 z backend.sh — chore-2026-10-04-1.
# Wymaga działającego backendu (deploy/aws/backend.sh all), aws CLI, npm, python3.
#
#   deploy/aws/frontend.sh all        # infra + build + upload + czekanie na wdrożenie CloudFront
#   deploy/aws/frontend.sh deploy     # kolejne wdrożenia frontendu: build, upload do S3, inwalidacja
#   deploy/aws/frontend.sh lockdown   # port 8000 na EC2 tylko z CloudFront (unlock = z powrotem dla wszystkich)
#   deploy/aws/frontend.sh status
#   deploy/aws/frontend.sh destroy    # wyłącza i usuwa dystrybucję, funkcję, OAC i bucket (z potwierdzeniem)
#
# Zmienne (opcjonalne): AWS_PROFILE, AWS_REGION (eu-central-1), NAME (hubmi), BUCKET (<NAME>-web-<konto>),
# ORIGIN_HTTPS=1 (API przez Caddy: origin <ip>.sslip.io:443 po HTTPS zamiast EC2:8000 po HTTP).
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text 2>/dev/null)" \
  || die "aws CLI niezalogowane (aws configure / AWS_PROFILE)"
BUCKET="${BUCKET:-$NAME-web-$ACCOUNT_ID}"
DIST_COMMENT="$NAME-web"
OAC_NAME="$NAME-web-oac"
FN_NAME="$NAME-spa-rewrite"
ORIGIN_HTTPS="${ORIGIN_HTTPS:-0}"

# Zarządzane polityki CloudFront (stałe ID AWS).
CACHE_OPTIMIZED="658327ea-f89d-4fab-a63d-7e88639e58f6"
CACHE_DISABLED="4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
ORP_ALL_VIEWER_EXCEPT_HOST="b689b0a8-53d0-40ab-baf2-68738e2966ac"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

dist_id() {
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='$DIST_COMMENT'].Id | [0]" --output text | grep -v '^None$' || true
}

dist_domain() {
  aws cloudfront get-distribution --id "$1" --query 'Distribution.DomainName' --output text
}

oac_id() {
  aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id | [0]" --output text | grep -v '^None$' || true
}

# Origin API: EC2:8000 po HTTP albo (ORIGIN_HTTPS=1) Caddy na <ip>.sslip.io:443 po HTTPS.
api_origin_domain() {
  if [ "$ORIGIN_HTTPS" = 1 ]; then echo "${API_DOMAIN:-$(public_ip | tr . -).sslip.io}"; else public_dns; fi
}
api_origin_policy() { [ "$ORIGIN_HTTPS" = 1 ] && echo https-only || echo http-only; }

# ---------- infra ----------

ensure_bucket() {
  if aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    log "Bucket $BUCKET: jest"
  else
    log "Tworzę prywatny bucket $BUCKET"
    if [ "$AWS_REGION" = us-east-1 ]; then
      aws s3api create-bucket --bucket "$BUCKET" >/dev/null
    else
      aws s3api create-bucket --bucket "$BUCKET" \
        --create-bucket-configuration "LocationConstraint=$AWS_REGION" >/dev/null
    fi
    aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  fi
}

ensure_oac() {
  local id; id="$(oac_id)"
  if [ -z "$id" ]; then
    log "Tworzę Origin Access Control $OAC_NAME" >&2
    id="$(aws cloudfront create-origin-access-control --origin-access-control-config \
      "Name=$OAC_NAME,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
      --query 'OriginAccessControl.Id' --output text)"
  fi
  echo "$id"
}

# Trasy SPA: ścieżka bez rozszerzenia → /index.html. Tylko na behaviorze domyślnym (S3), /api/* bez zmian.
ensure_function() {
  cat > "$TMP/fn.js" <<'JS'
function handler(event) {
  var req = event.request;
  if (req.uri.indexOf('.') === -1) {
    req.uri = '/index.html';
  }
  return req;
}
JS
  local etag
  if etag="$(aws cloudfront describe-function --name "$FN_NAME" --query ETag --output text 2>/dev/null)"; then
    etag="$(aws cloudfront update-function --name "$FN_NAME" --if-match "$etag" \
      --function-config "Comment=HubMI SPA rewrite,Runtime=cloudfront-js-2.0" \
      --function-code "fileb://$TMP/fn.js" --query ETag --output text)"
  else
    log "Tworzę CloudFront Function $FN_NAME" >&2
    etag="$(aws cloudfront create-function --name "$FN_NAME" \
      --function-config "Comment=HubMI SPA rewrite,Runtime=cloudfront-js-2.0" \
      --function-code "fileb://$TMP/fn.js" --query ETag --output text)"
  fi
  aws cloudfront publish-function --name "$FN_NAME" --if-match "$etag" >/dev/null
  aws cloudfront describe-function --name "$FN_NAME" --stage LIVE \
    --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text
}

write_dist_config() { # oac fn_arn api_domain api_policy
  cat > "$TMP/dist.json" <<JSON
{
  "CallerReference": "$NAME-web-$(date +%s)",
  "Comment": "$DIST_COMMENT",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2and3",
  "IsIPV6Enabled": true,
  "ViewerCertificate": { "CloudFrontDefaultCertificate": true },
  "Origins": { "Quantity": 2, "Items": [
    { "Id": "s3", "DomainName": "$BUCKET.s3.$AWS_REGION.amazonaws.com",
      "OriginAccessControlId": "$1", "S3OriginConfig": { "OriginAccessIdentity": "" } },
    { "Id": "api", "DomainName": "$3",
      "CustomOriginConfig": { "HTTPPort": 8000, "HTTPSPort": 443, "OriginProtocolPolicy": "$4",
        "OriginReadTimeout": 60, "OriginKeepaliveTimeout": 5,
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] } } }
  ] },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3", "ViewerProtocolPolicy": "redirect-to-https", "Compress": true,
    "CachePolicyId": "$CACHE_OPTIMIZED",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } },
    "FunctionAssociations": { "Quantity": 1, "Items": [ { "FunctionARN": "$2", "EventType": "viewer-request" } ] }
  },
  "CacheBehaviors": { "Quantity": 2, "Items": [
    { "PathPattern": "/api/*", "TargetOriginId": "api", "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": false, "CachePolicyId": "$CACHE_DISABLED", "OriginRequestPolicyId": "$ORP_ALL_VIEWER_EXCEPT_HOST",
      "AllowedMethods": { "Quantity": 7, "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } } },
    { "PathPattern": "/healthz", "TargetOriginId": "api", "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": false, "CachePolicyId": "$CACHE_DISABLED", "OriginRequestPolicyId": "$ORP_ALL_VIEWER_EXCEPT_HOST",
      "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"],
        "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } } }
  ] }
}
JSON
}

# Istniejąca dystrybucja: odśwież origin API (EC2 mógł dostać nowy adres) i funkcję.
update_dist() { # id api_domain api_policy fn_arn
  local etag
  etag="$(aws cloudfront get-distribution-config --id "$1" --output json > "$TMP/cur.json" &&
    python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$TMP/cur.json")"
  python3 - "$TMP/cur.json" "$TMP/new.json" "$2" "$3" "$4" <<'PY'
import json, sys
cur, out, domain, policy, fn_arn = sys.argv[1:]
cfg = json.load(open(cur))["DistributionConfig"]
before = json.dumps(cfg, sort_keys=True)
for o in cfg["Origins"]["Items"]:
    if o["Id"] == "api":
        o["DomainName"] = domain
        o["CustomOriginConfig"]["OriginProtocolPolicy"] = policy
fa = cfg["DefaultCacheBehavior"].setdefault("FunctionAssociations", {"Quantity": 0})
fa.update({"Quantity": 1, "Items": [{"FunctionARN": fn_arn, "EventType": "viewer-request"}]})
json.dump(cfg, open(out, "w"))
sys.exit(0 if json.dumps(cfg, sort_keys=True) != before else 3)
PY
  local rc=$?
  if [ "$rc" = 3 ]; then log "Dystrybucja $1: bez zmian"; return 0; fi
  log "Aktualizuję dystrybucję $1 (origin API → $2)"
  aws cloudfront update-distribution --id "$1" --if-match "$etag" \
    --distribution-config "file://$TMP/new.json" >/dev/null
}

put_bucket_policy() { # dist_id
  cat > "$TMP/policy.json" <<JSON
{ "Version": "2012-10-17", "Statement": [ {
  "Sid": "AllowCloudFrontRead", "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject", "Resource": "arn:aws:s3:::$BUCKET/*",
  "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::$ACCOUNT_ID:distribution/$1" } }
} ] }
JSON
  aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://$TMP/policy.json"
}

cmd_infra() {
  log "Region $AWS_REGION, bucket $BUCKET"
  ensure_bucket
  local oac fn_arn api_domain api_policy id
  oac="$(ensure_oac)"
  fn_arn="$(ensure_function)"
  api_domain="$(api_origin_domain)"
  api_policy="$(api_origin_policy)"
  id="$(dist_id)"
  if [ -z "$id" ]; then
    log "Tworzę dystrybucję CloudFront (S3 + /api/* → $api_domain, $api_policy)"
    write_dist_config "$oac" "$fn_arn" "$api_domain" "$api_policy"
    id="$(aws cloudfront create-distribution --distribution-config "file://$TMP/dist.json" \
      --query 'Distribution.Id' --output text)"
  else
    set +e; update_dist "$id" "$api_domain" "$api_policy" "$fn_arn"; local rc=$?; set -e
    [ "$rc" = 0 ] || die "aktualizacja dystrybucji $id nie powiodła się"
  fi
  put_bucket_policy "$id"
  log "CloudFront: $id → https://$(dist_domain "$id")"
}

# ---------- deploy frontendu ----------

cmd_deploy() {
  local id; id="$(dist_id)"
  [ -n "$id" ] || die "brak dystrybucji — uruchom najpierw: $0 all"
  [ -d "$REPO_ROOT/web/node_modules" ] || (log "npm ci"; cd "$REPO_ROOT/web" && npm ci --no-audit --no-fund)
  log "Build frontendu (VITE_API_BASE_URL pusty: API pod tym samym adresem przez CloudFront /api/*)"
  # zmienna z procesu wygrywa z web/.env.production.local
  VITE_API_BASE_URL="" make -C "$REPO_ROOT" --no-print-directory web-deploy S3_BUCKET="$BUCKET" CF_DISTRIBUTION="$id" >/dev/null
  log "Frontend wgrany: https://$(dist_domain "$id")"
}

# ---------- port 8000 tylko z CloudFront ----------

cmd_lockdown() {
  local sg pl; sg="$(sg_id)"; pl="$(cf_prefix_list)"
  [ -n "$sg" ] || die "brak security group $SG_NAME"
  log "Port 8000: tylko z CloudFront ($pl)"
  aws ec2 authorize-security-group-ingress --group-id "$sg" --ip-permissions \
    "IpProtocol=tcp,FromPort=8000,ToPort=8000,PrefixListIds=[{PrefixListId=$pl,Description=cloudfront}]" \
    >/dev/null 2>&1 || true
  aws ec2 revoke-security-group-ingress --group-id "$sg" --protocol tcp --port 8000 --cidr 0.0.0.0/0 \
    >/dev/null 2>&1 || true
  log "Gotowe. http://<EIP>:8000 nie odpowiada już z internetu — API tylko przez CloudFront."
}

cmd_unlock() {
  local sg pl; sg="$(sg_id)"; pl="$(cf_prefix_list)"
  log "Port 8000: z powrotem dla wszystkich"
  aws ec2 authorize-security-group-ingress --group-id "$sg" --protocol tcp --port 8000 --cidr 0.0.0.0/0 \
    >/dev/null 2>&1 || true
  aws ec2 revoke-security-group-ingress --group-id "$sg" --ip-permissions \
    "IpProtocol=tcp,FromPort=8000,ToPort=8000,PrefixListIds=[{PrefixListId=$pl}]" >/dev/null 2>&1 || true
}

# ---------- reszta ----------

cmd_status() {
  local id; id="$(dist_id)"
  [ -n "$id" ] || { echo "Brak dystrybucji $DIST_COMMENT."; return 0; }
  echo "Dystrybucja: $id ($(aws cloudfront get-distribution --id "$id" --query 'Distribution.Status' --output text))"
  echo "Strona:      https://$(dist_domain "$id")"
  echo "API:         https://$(dist_domain "$id")/healthz"
  echo "Bucket:      s3://$BUCKET"
  api_locked_down && echo "Port 8000:   tylko CloudFront" || echo "Port 8000:   otwarty dla wszystkich"
}

cmd_destroy() {
  local id oac; id="$(dist_id)"; oac="$(oac_id)"
  echo "Usunę: dystrybucję ${id:-–}, funkcję $FN_NAME, OAC ${oac:-–}, bucket $BUCKET z zawartością. Backend zostaje."
  read -r -p "Wpisz nazwę ($NAME), żeby potwierdzić: " answer
  [ "$answer" = "$NAME" ] || die "przerwano"
  if [ -n "$id" ]; then
    local etag
    aws cloudfront get-distribution-config --id "$id" --output json > "$TMP/cur.json"
    etag="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$TMP/cur.json")"
    python3 -c 'import json,sys; c=json.load(open(sys.argv[1]))["DistributionConfig"]; c["Enabled"]=False; json.dump(c,open(sys.argv[2],"w"))' \
      "$TMP/cur.json" "$TMP/off.json"
    log "Wyłączam dystrybucję $id (to trwa kilka minut)…"
    etag="$(aws cloudfront update-distribution --id "$id" --if-match "$etag" \
      --distribution-config "file://$TMP/off.json" --query ETag --output text)"
    aws cloudfront wait distribution-deployed --id "$id"
    aws cloudfront delete-distribution --id "$id" --if-match "$etag"
  fi
  local fetag
  if fetag="$(aws cloudfront describe-function --name "$FN_NAME" --query ETag --output text 2>/dev/null)"; then
    aws cloudfront delete-function --name "$FN_NAME" --if-match "$fetag"
  fi
  if [ -n "$oac" ]; then
    aws cloudfront delete-origin-access-control --id "$oac" --if-match \
      "$(aws cloudfront get-origin-access-control --id "$oac" --query ETag --output text)"
  fi
  if aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
    aws s3 rm "s3://$BUCKET" --recursive >/dev/null
    aws s3api delete-bucket --bucket "$BUCKET"
  fi
  cmd_unlock >/dev/null 2>&1 || true
  log "Usunięte. Port 8000 znów otwarty dla wszystkich (backend.sh status)."
}

case "${1:-}" in
  infra)    cmd_infra ;;
  deploy)   cmd_deploy ;;
  all)
    cmd_infra; cmd_deploy
    log "Czekam na wdrożenie CloudFront (pierwszy raz 5–15 min)…"
    aws cloudfront wait distribution-deployed --id "$(dist_id)"
    cmd_status
    log "Gdy strona działa, zawęź port 8000: $0 lockdown" ;;
  lockdown) cmd_lockdown ;;
  unlock)   cmd_unlock ;;
  status)   cmd_status ;;
  destroy)  cmd_destroy ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
