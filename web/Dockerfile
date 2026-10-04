# Frontend HubMI: build Vite + serwowanie przez nginx.
# Kontekst budowania: katalog web/ (filtrowany przez web/.dockerignore)
# plus dodatkowy kontekst "design-system" (../design-system), bo main.tsx
# importuje ../../design-system/*.css. Oba ustawia serwis `web` w docker-compose.yml.
# Ręcznie: docker build -f web/Dockerfile --build-context design-system=design-system web

FROM node:22-alpine AS build
WORKDIR /app/web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --from=design-system . /app/design-system
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
