# chore-2026-10-04-1 — Wdrożenie na AWS (S3 dla frontendu, jedna EC2 z Dockerem dla API i bazy)

**Status:** w toku

Aplikacja ma działać publicznie na AWS: frontend to statyczne pliki w S3, a FastAPI i PostgreSQL
działają w Dockerze na **jednej** maszynie EC2. Najpierw wdrażamy backend, frontend dochodzi później.

## Do zmiany

1. **Adres backendu we frontendzie**
   - Wszystkie żądania frontendu (`request`, strumień czatu `/api/chat`, strumień `/api/solutions/{id}/adapt-chat`)
     budują adres przez jedną funkcję `apiUrl()` z `web/src/api/base.ts`.
   - Adres ustawia zmienna `VITE_API_BASE_URL`, wkompilowana przy buildzie. Pusta wartość oznacza ten sam origin,
     czyli dotychczasowe zachowanie (proxy Vite, nginx w `make up`, CloudFront `/api/*`).
   - `web/.env.example` opisuje zmienną. Pliki `web/.env*.local` są poza gitem i poza obrazem Dockera.
2. **Backend na EC2: jedna maszyna, dwa kontenery**
   - Nakładka `docker-compose.aws.yml` uruchamia tylko `db` (pgvector/pg16) i `api` z `restart: unless-stopped`.
     Port bazy nie jest wystawiony na hoście.
   - HTTPS na tej samej maszynie: kontener `caddy` (Let's Encrypt) na 80/443 przekazuje ruch do `api:8000`.
     Domenę podaje `API_DOMAIN` w `.env` (własna albo `<ip>.sslip.io`).
3. **Frontend na S3**
   - `make web-deploy S3_BUCKET=… [CF_DISTRIBUTION=…]` buduje frontend, wysyła go do S3 z nagłówkami cache
     i opcjonalnie unieważnia cache CloudFront.
4. **Instrukcja wdrożenia** krok po kroku jest w `plan.md`.

## Kryterium akceptacji

- `npm run lint` i `npm run build` przechodzą. Bez `VITE_API_BASE_URL` bundle woła ścieżki względne, tak jak dotąd.
- Z `VITE_API_BASE_URL=http://<ip>:8000` bundle woła EC2, a czat strumieniuje tokeny.
- `curl http://<ip>:8000/healthz` z internetu odpowiada `200`. Port 5432 nie jest dostępny z zewnątrz.
- Strona z CloudFront otwiera się po HTTPS. Odświeżenie podstrony (np. `/panel/zgloszenia/1`) nie daje 404,
  a 404 z API pozostaje JSON-em.
