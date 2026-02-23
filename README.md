# Portfolio (Spring Boot + Next.js)

## 1) PostgreSQL (Docker)

Run DB container:

```bash
docker run --name portfolio-db -e POSTGRES_DB=portfolio -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -p 5432:5432 -d postgres:16
```

If already created, start it:

```bash
docker start portfolio-db
```

Check tables:

```bash
docker exec -it portfolio-db psql -U portfolio -d portfolio -c "\dt"
```

Check project rows:

```bash
docker exec -it portfolio-db psql -U portfolio -d portfolio -c "select category,title,slug from projects;"
```

## 2) Backend Run (Spring Boot)

Datasource defaults:

- `jdbc:postgresql://localhost:5432/portfolio`
- `username=portfolio`
- `password=portfolio`

Override with env vars when needed:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `APP_ADMIN_USERNAME`
- `APP_ADMIN_PASSWORD`
- `APP_AUTH_ENABLED`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_AUTH_KAKAO_WEBHOOK_URL`
- `APP_AUTH_PASS_WEBHOOK_URL`

Run default profile:

```bash
./mvnw spring-boot:run
```

Run `dev` profile (seed enabled):

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

`dev` profile inserts seed projects only when missing:

- `FIRMWARE` / `low-latency-firmware`
- `SOFTWARE` / `portfolio-web`

## 2-1) Phone OTP Auth (DB-backed)

All OTP/session/attempt history is persisted in DB tables:

- `access_codes`
- `auth_sessions`
- `auth_attempt_logs`

Request OTP (public API):

```bash
curl -X POST http://localhost:8081/api/public/auth/request-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"01012345678\",\"channel\":\"KAKAO\"}"
```

Verify OTP and create session cookie:

```bash
curl -i -X POST http://localhost:8081/api/public/auth/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"01012345678\",\"channel\":\"KAKAO\",\"code\":\"123456\"}"
```

Check session:

```bash
curl -i http://localhost:8081/api/public/auth/session
```

Delivery notes:

- `channel` supports `KAKAO` and `PASS`.
- If `app.auth.kakao-webhook-url` / `app.auth.pass-webhook-url` is not configured, OTP is logged in backend logs (local-dev fallback).
- To use real KakaoTalk/PASS delivery, connect each channel to your provider webhook endpoint.

## Security Notes (GitHub Upload)

- Do not commit `.env*`, logs, or cookie files.
- Use environment variables for credentials instead of hardcoding.
- Change `APP_ADMIN_PASSWORD` before production use.

## 3) Frontend Run (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

Frontend env (deployment example):

- `NEXT_PUBLIC_API_BASE_URL=https://api.xhbt.dev`
- `NEXT_PUBLIC_AUTH_ENABLED=false`

## 4) Major Endpoints / Test URLs

Backend:

- `http://localhost:8081/api/public/health`
- `http://localhost:8081/api/public/auth/request-code`
- `http://localhost:8081/api/public/auth/verify-code`
- `http://localhost:8081/api/public/auth/session`
- `http://localhost:8081/api/public/projects`
- `http://localhost:8081/api/public/projects?category=FIRMWARE`
- `http://localhost:8081/api/public/projects/portfolio-web`

Frontend:

- `http://localhost:3000/auth`
- `http://localhost:3000/projects`
- `http://localhost:3000/projects/portfolio-web`
