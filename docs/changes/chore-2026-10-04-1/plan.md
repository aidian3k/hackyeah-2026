# chore-2026-10-04-1 — plan: wdrożenie na AWS

Spec: [spec.md](spec.md).

**Decyzja (2026-10-04):** frontend jest serwowany przez **CloudFront** (krok 3A). Kolejność wdrożenia:

1. **EC2 z Dockerem (db + api):** kroki 1.1–1.8. Na start zostaje HTTP na porcie 8000.
2. **S3 i CloudFront** z behaviorem `/api/*` → EC2: kroki 2 i 3A. `VITE_API_BASE_URL` zostaje pusty.
3. **Zawężenie portu 8000** do CloudFront: krok 4.

Caddy (krok 1.9) jest opcjonalny. Przydaje się tylko wtedy, gdy API ma mieć własny adres HTTPS niezależny od CloudFront.
Krok 3B (S3 po HTTP) nie dotyczy tego wdrożenia.

## Architektura

```
                    ┌──────────────── CloudFront (HTTPS, *.cloudfront.net) ────────────────┐
przeglądarka ──────▶│  /*        → S3 (prywatny bucket, OAC)        ← make web-deploy       │
                    │  /api/*    → EC2 :8000 (HTTP, bez cache)                              │
                    │  /healthz  → EC2 :8000                                                │
                    └───────────────────────────────────────────────────────────────────────┘
                                                   │
                         EC2 (Amazon Linux 2023, t3.small, Elastic IP)
                         docker compose -f docker-compose.yml -f docker-compose.aws.yml
                           ├─ api  (FastAPI/uvicorn, :8000 na hoście)
                           └─ db   (pgvector/pgvector:pg16, wolumen pgdata, bez portu na hoście)
```

Postgres i FastAPI działają na **jednej** maszynie EC2 jako dwa kontenery Dockera. API łączy się z bazą
przez sieć compose (`db:5432`), a baza nie jest dostępna z internetu.

**Dlaczego CloudFront, a nie sam „S3 static website”:** endpoint strony S3 działa tylko po HTTP. Jeśli frontend
będzie po HTTPS, a API po HTTP, przeglądarka zablokuje żądania (mixed content). CloudFront daje HTTPS
bez własnej domeny i serwuje `/api/*` z tego samego originu. Wtedy `VITE_API_BASE_URL` zostaje pusty i CORS nie jest potrzebny.
Wariant szybki bez CloudFront, cały po HTTP, opisuje [krok 3B](#3b-wariant-szybki-s3-website-po-http-bez-cloudfront).

## 0. Zmiany w kodzie (zrobione)

| Plik | Zmiana |
|---|---|
| `web/src/api/base.ts` | `API_BASE_URL` z `VITE_API_BASE_URL` i funkcja `apiUrl(path)`, jedyne miejsce z adresem backendu |
| `web/src/api/client.ts`, `sse.ts`, `middleman.ts` | każdy `fetch` przechodzi przez `apiUrl()` |
| `web/src/vite-env.d.ts` | typ `VITE_API_BASE_URL` |
| `web/.env.example` | opis zmiennej |
| `.gitignore`, `web/.dockerignore` | `.env*.local` (lokalny adres nie trafia do gita ani do obrazu nginx) |
| `docker-compose.aws.yml` | nakładka dla EC2: restart, baza bez portu na hoście, kontener `caddy` (HTTPS) |
| `Caddyfile` | HTTPS dla API: Let's Encrypt dla `API_DOMAIN` → `api:8000` |
| `Makefile` | `make web-deploy S3_BUCKET=… [CF_DISTRIBUTION=…]` |

**Jak zmienić adres backendu:**

```bash
# web/.env.local            → dla `npm run dev` / `make web-dev`
# web/.env.production.local → dla `npm run build` / `make web-deploy`
VITE_API_BASE_URL=http://<ELASTIC_IP>:8000   # bez końcowego "/"; pusty = ten sam origin
```

Wartość jest wkompilowana w bundle. Po zmianie trzeba ponownie zbudować frontend i wysłać go do S3 (`make web-deploy`).
Gdy frontend woła API pod innym originem, ten origin musi być w `CORS_ORIGINS` w `.env` na EC2.

---

## 1. Backend na EC2 (najpierw)

### 1.1. Przygotowanie w konsoli AWS

1. **Region:** `eu-central-1` (Frankfurt). Wszystko poniżej zakładaj w tym samym regionie.
2. **Key pair:** EC2 → Key Pairs → Create → `splot-key` (ed25519, `.pem`). Potem `chmod 400 splot-key.pem`.
3. **Security group** `splot-api-sg`, reguły przychodzące:

   | Port | Źródło | Po co |
   |---|---|---|
   | 22 | *My IP* | SSH |
   | 8000 | `0.0.0.0/0` (na etap 1) | API; po wdrożeniu CloudFront zawęź (krok 4) |

   **Nie** otwieraj 5432. Bazy pilnuje też nakładka compose, która nie wystawia jej portu.
4. **Instancja:** EC2 → Launch instance
   - AMI: **Amazon Linux 2023** (x86_64)
   - typ: **t3.small** (2 GB RAM, wystarczy na Postgres i API; budowa obrazu też się zmieści). Przy problemach z pamięcią użyj t3.medium.
   - key pair: `splot-key`, security group: `splot-api-sg`
   - dysk: **20 GB gp3**
5. **Elastic IP:** EC2 → Elastic IPs → Allocate → Associate z instancją. Adres się nie zmieni po restarcie.
   Dalej nazywam go `<EIP>`. Zapisz też **Public IPv4 DNS** (`ec2-…eu-central-1.compute.amazonaws.com`),
   bo CloudFront potrzebuje nazwy domenowej, a nie IP.

### 1.2. Docker na maszynie

```bash
ssh -i splot-key.pem ec2-user@<EIP>

sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# wtyczka docker compose (AL2023 nie ma jej w repo)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
# buildx (compose build go wymaga)
sudo curl -SL https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.linux-amd64 \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

# 2 GB swap: zapas przy budowie obrazu i ingeście
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab

exit   # wyloguj się i zaloguj ponownie, żeby zadziałała grupa docker
```

Sprawdź: `docker compose version` powinno pokazać wersję ≥ 2.24 (wymagana dla `!reset` w nakładce).

### 1.3. Kod i `.env`

Repozytorium `aidian3k/hackyeah-2026`. Jeśli jest prywatne, dodaj deploy key albo sklonuj przez
`https://<token>@github.com/...`. Możesz też wysłać kod z laptopa przez rsync:

```bash
# na EC2
git clone https://github.com/aidian3k/hackyeah-2026.git splot && cd splot

# alternatywa z laptopa (bez gita na serwerze):
# rsync -az --exclude .venv --exclude web/node_modules --exclude .git -e "ssh -i splot-key.pem" ./ ec2-user@<EIP>:splot/
```

`.env` nie jest w gicie. Wyślij go z laptopa i popraw na serwerze:

```bash
# z laptopa
scp -i splot-key.pem .env ec2-user@<EIP>:splot/.env
```

Na serwerze w `splot/.env` ustaw:

```bash
OPENAI_API_KEY=sk-...            # embeddingi + LLM
COHERE_API_KEY=...               # albo RERANK_PROVIDER=noop + RERANK_ENABLED=false
# kto może wołać API z przeglądarki (originy po przecinku, bez "/" na końcu):
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```

`DATABASE_URL` z `.env` nie ma znaczenia w kontenerze, bo `docker-compose.yml` nadpisuje go na `db:5432`.
Hasło bazy `splot/splot` może zostać, bo baza nie wychodzi poza sieć Dockera.

### 1.4. Start

```bash
cd ~/splot
alias dc='docker compose -f docker-compose.yml -f docker-compose.aws.yml'   # dopisz do ~/.bashrc

dc up -d --build db api   # z HTTPS: db api caddy (krok 1.9)
dc ps                    # db: healthy, api: running
dc logs -f api           # Ctrl+C
```

Przy pierwszym starcie (pusty wolumen `pgdata`) Postgres sam wykonuje wszystkie pliki `db/*.sql`
alfabetycznie: `init.sql`, `m2-…`, `m3-…`, `m4-…`, `m5-…`. Nie trzeba uruchamiać `make db-mN`.

### 1.5. Dane (jednorazowo, w kontenerze `api`)

Kolejność ma znaczenie: seedy szukają rozwiązań po tytule lub hashu.

```bash
dc exec api python -m scripts.ingest data/solutions/              # Biblioteka ROPS (embeddingi OpenAI)
dc exec api python -m scripts.ingest data/knowledge/records/      # raporty i materiały (M2)
dc exec api python -m scripts.ingest_knowledge data/knowledge/    # wyzwania i wskaźniki (M2)
dc exec api python -m scripts.seed_reports                        # zgłoszenia demo przez /api/chat (localhost:8000 w kontenerze)
dc exec api python -m scripts.seed_ideas                          # M3
dc exec api python -m scripts.seed_innovation_tests               # M4, wypisuje linki dostępowe
dc exec api python -m scripts.seed_comm                           # M5
```

Wszystkie skrypty są idempotentne i można je powtarzać.

### 1.6. Weryfikacja etapu 1

```bash
# z laptopa
curl http://<EIP>:8000/healthz
curl -N -X POST http://<EIP>:8000/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"U nas w gminie starsi ludzie siedzą sami w domach i nie mają z kim pogadać"}'
nc -zv <EIP> 5432        # ma się NIE połączyć
```

### 1.7. Lokalny frontend z backendem na EC2

Do testów przed wdrożeniem frontendu masz dwie drogi:

- **Proxy Vite, bez CORS:** `cd web && VITE_API_TARGET=http://<EIP>:8000 npm run dev`
- **Bezpośrednio, tak jak będzie na S3:** `web/.env.local` z `VITE_API_BASE_URL=http://<EIP>:8000`, potem `npm run dev`.
  Wymaga `CORS_ORIGINS=http://localhost:5173` na EC2 (po zmianie `.env`: `dc up -d api`).

### 1.8. Aktualizacja backendu

```bash
cd ~/splot && git pull     # albo rsync z laptopa
dc up -d --build api       # baza zostaje, dane w wolumenie pgdata
```

Zmiana w `db/*.sql` **nie** wykona się sama na istniejącym wolumenie. Wgraj ją ręcznie:
`dc exec -T db psql -U splot -d splot -v ON_ERROR_STOP=1 < db/m4-tester.sql`.
Nigdy nie używaj `dc down -v` na produkcji, bo kasuje bazę.

### 1.9. HTTPS na EC2 (Caddy)

Na tej samej maszynie działa trzeci kontener, **Caddy**. Przyjmuje ruch na 443, sam pobiera i odnawia certyfikat
Let's Encrypt i przekazuje żądania do `api:8000`. Konfiguracja jest w [`Caddyfile`](../../../Caddyfile) i `docker-compose.aws.yml`.

```
przeglądarka ──HTTPS:443──▶ caddy ──HTTP──▶ api:8000 ──▶ db:5432      (jedna EC2, sieć compose)
```

1. **Domena wskazująca na `<EIP>`.** Wybierz jedną:
   - własna domena: rekord **A** `api.twojadomena.pl → <EIP>` (Route 53 albo panel rejestratora);
   - bez domeny: `<EIP-z-myślnikami>.sslip.io`, np. dla `3.121.10.20` → `3-121-10-20.sslip.io`.
     Ta nazwa sama wskazuje na IP i nic nie trzeba ustawiać. Jeśli Let's Encrypt odrzuci ją przez limit wystawień,
     spróbuj `3-121-10-20.nip.io` albo własnej domeny.
   - Sprawdź: `dig +short <domena>` ma zwrócić `<EIP>`.
2. **Security group** `splot-api-sg`: dodaj **80** i **443** z `0.0.0.0/0`. Port 80 jest potrzebny do weryfikacji
   Let's Encrypt i przekierowania na HTTPS. Regułę **8000** usuń, bo API wychodzi teraz tylko przez Caddy.
3. **`.env` na EC2:**
   ```bash
   API_DOMAIN=3-121-10-20.sslip.io
   CORS_ORIGINS=http://localhost:5173,https://dxxxx.cloudfront.net   # origin(y) frontendu
   ```
4. **Start:**
   ```bash
   dc up -d --build db api caddy
   dc logs -f caddy        # czekaj na "certificate obtained successfully"
   curl https://3-121-10-20.sslip.io/healthz
   ```
5. **Frontend:** w `web/.env.production.local` ustaw `VITE_API_BASE_URL=https://3-121-10-20.sslip.io`, potem `make web-deploy …`.
   Frontend i API mają wtedy różne originy, więc adres frontendu **musi** być w `CORS_ORIGINS` (po zmianie `dc up -d api`).

Uwagi:
- Certyfikaty są w wolumenie `caddy-data`. Nie kasuj go (`down -v`), bo Let's Encrypt ogranicza liczbę wystawień na tydzień.
- Caddy kompresuje tylko JSON, więc SSE (`text/event-stream`) idzie bez buforowania i kompresji.
- Gdy API jest po HTTPS, frontend może być w S3 po HTTP (3B) albo w CloudFront po HTTPS (3A). W 3A behaviorów
  `/api/*` wtedy nie potrzebujesz, bo frontend woła `https://<API_DOMAIN>` bezpośrednio.

**Który wariant HTTPS wybrać:**

| | Caddy na EC2 (1.9) | CloudFront `/api/*` (3A) |
|---|---|---|
| domena | własna albo sslip.io | nie trzeba (`*.cloudfront.net`) |
| CORS | potrzebny (inny origin) | niepotrzebny (ten sam origin) |
| `VITE_API_BASE_URL` | `https://<API_DOMAIN>` | pusty |
| API dostępne bez frontendu (curl, Swagger `/docs`) | tak, po HTTPS | tak, przez `https://dxxxx.cloudfront.net/api/...` |
| porty w SG | 22, 80, 443 | 22, 8000 (tylko z CloudFront) |

---

## 2. Bucket S3

1. S3 → Create bucket → np. `splot-web-<twoj-sufiks>` (nazwa globalnie unikalna), region `eu-central-1`.
2. W wariancie z CloudFront (zalecanym) zostaw włączone **Block all public access**. Bucket jest prywatny, czyta go tylko CloudFront.
3. Na laptopie: `aws configure` (klucze użytkownika IAM z prawami do S3 i CloudFront), region `eu-central-1`.

## 3A. CloudFront (zalecane: HTTPS i jeden origin)

### 3A.1. Dystrybucja

CloudFront → Create distribution:

- **Origin 1 (domyślny):** bucket S3 (nie endpoint „website”), **Origin access: Origin access control (OAC)** → Create OAC.
  Po utworzeniu dystrybucji kliknij „Copy policy” i wklej ją w Bucket policy bucketu.
- **Default root object:** `index.html`
- **Viewer protocol policy:** Redirect HTTP to HTTPS
- **Price class:** Use only North America and Europe

Po utworzeniu dodaj:

- **Origin 2:** domena = *Public IPv4 DNS* instancji (`ec2-…compute.amazonaws.com`), protocol **HTTP only**, port **8000**,
  **Response timeout 60 s** (pierwszy token LLM w SSE może przyjść po kilkunastu sekundach).
- **Behaviors** (kolejność: najpierw konkretne ścieżki):

  | Ścieżka | Origin | Metody | Cache policy | Origin request policy | Compress |
  |---|---|---|---|---|---|
  | `/api/*` | EC2 | GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE | **CachingDisabled** | **AllViewerExceptHostHeader** | **No** (SSE) |
  | `/healthz` | EC2 | GET, HEAD | CachingDisabled | AllViewerExceptHostHeader | No |
  | `Default (*)` | S3 | GET, HEAD | CachingOptimized | — | Yes |

### 3A.2. Trasy SPA (`/panel/zgloszenia/12` po odświeżeniu)

**Nie** używaj „Custom error responses 404 → /index.html”, bo działają na całą dystrybucję i zamieniłyby
404 z API (JSON) na HTML. Zamiast tego CloudFront → Functions → Create `splot-spa-rewrite`:

```js
function handler(event) {
  var req = event.request;
  // ścieżka bez rozszerzenia = trasa Reacta → index.html; pliki (/assets/x.js, /rops-logo.png) bez zmian
  if (req.uri.indexOf('.') === -1) {
    req.uri = '/index.html';
  }
  return req;
}
```

Publish, potem Associate z behaviorem **Default (*)**, event **Viewer request**. Behaviorów `/api/*` nie podpinaj.

### 3A.3. Wdrożenie frontendu

```bash
# web/.env.production.local: zostaw pusty albo nie twórz pliku (ten sam origin)
make web-deploy S3_BUCKET=splot-web-<sufiks> CF_DISTRIBUTION=<ID dystrybucji, np. E1ABCDEF>
```

Strona: `https://dxxxx.cloudfront.net`. Dopisz ten adres do `CORS_ORIGINS` na EC2. Przy tym samym originie
nie jest potrzebny, ale nie szkodzi i pomaga, gdy ktoś zbuduje frontend z pełnym URL.

## 3B. Wariant szybki: S3 website po HTTP, bez CloudFront

Na szybki test, bez HTTPS:

1. Bucket: wyłącz *Block all public access*, Properties → **Static website hosting**: index `index.html`,
   error `index.html` (trasy SPA). Bucket policy:
   ```json
   {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject",
     "Resource":"arn:aws:s3:::splot-web-<sufiks>/*"}]}
   ```
2. `web/.env.production.local`: `VITE_API_BASE_URL=http://<EIP>:8000`
3. Na EC2 w `.env`: `CORS_ORIGINS=http://localhost:5173,http://splot-web-<sufiks>.s3-website.eu-central-1.amazonaws.com`, potem `dc up -d api`.
4. `make web-deploy S3_BUCKET=splot-web-<sufiks>`
5. Strona: `http://splot-web-<sufiks>.s3-website.eu-central-1.amazonaws.com`

Ograniczenie: wszystko po HTTP. Strona po HTTPS (np. CloudFront) z `VITE_API_BASE_URL=http://…` nie zadziała (mixed content).

## 4. Zabezpieczenie po wdrożeniu CloudFront

- W `splot-api-sg` zamień regułę `8000 ← 0.0.0.0/0` na `8000 ← prefix list com.amazonaws.global.cloudfront.origin-facing`
  (VPC → Managed prefix lists). Wtedy API odpowiada tylko przez CloudFront. Do testów curl dodaj tymczasowo *My IP*.
- SSH (22) tylko z *My IP*.
- Kopia bazy przed demo: `dc exec -T db pg_dump -U splot splot | gzip > splot-$(date +%F).sql.gz`.

## 5. Weryfikacja końcowa

- [ ] `https://dxxxx.cloudfront.net` się otwiera, logo i fonty działają
- [ ] czat „Znajdź rozwiązanie” strumieniuje tokeny na bieżąco, a nie wszystkie naraz na końcu
- [ ] odświeżenie `/panel/...` i innych podstron nie daje 404
- [ ] `https://dxxxx.cloudfront.net/api/solutions/999999` zwraca JSON 404, a nie HTML
- [ ] `https://dxxxx.cloudfront.net/healthz` zwraca 200
- [ ] po `sudo reboot` instancji oba kontenery wstają same

## 6. Problemy i przyczyny

| Objaw | Przyczyna / rozwiązanie |
|---|---|
| „CORS policy” w konsoli | origin frontendu nie jest w `CORS_ORIGINS` (dokładnie, bez `/` na końcu); potem `dc up -d api` |
| „Mixed content” | strona po HTTPS, `VITE_API_BASE_URL=http://…`; użyj CloudFront `/api/*` i pustej zmiennej |
| czat pokazuje odpowiedź dopiero na końcu | w `/api/*` włączone Compress albo cache; ustaw CachingDisabled i Compress = No |
| 403 z CloudFront na `/` | brak bucket policy dla OAC albo brak Default root object |
| 504 z CloudFront na `/api/*` | SG nie wpuszcza CloudFront na 8000 albo api leży (`dc ps`, `dc logs api`) |
| stary frontend po deployu | brak inwalidacji; podaj `CF_DISTRIBUTION=…` w `make web-deploy` |
| `!reset` nieznany | za stara wtyczka compose; zainstaluj najnowszą (krok 1.2) |

## 7. Koszt (orientacyjnie, eu-central-1)

t3.small ~17 USD/mies., EBS 20 GB ~2 USD, publiczne IPv4/Elastic IP ~4 USD. S3 i CloudFront przy ruchu demo
kosztują grosze (free tier). Do tego płatne wywołania OpenAI/Cohere. Po hackathonie: Terminate instance,
Release Elastic IP, usuń dystrybucję i bucket.

## Weryfikacja ręczna (stan)

- [x] `npm run lint`, `npm run build`. Bez zmiennej bundle nie zawiera adresu, z `VITE_API_BASE_URL` adres jest w bundlu.
- [x] `docker compose -f docker-compose.yml -f docker-compose.aws.yml config`: baza bez portu na hoście.
- [x] `make -n web-deploy`: komendy `aws s3 sync` i inwalidacji poprawne.
- [ ] wdrożenie na AWS (kroki 1–5) wykonuje zespół.
