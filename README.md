# Seer Bharat — Wildlife Safety App

Seer Bharat lets the public report wildlife sightings and gives Forest Department users a live dashboard for reports and alerts. It includes a Node.js/Express API, SQLite persistence, JWT-based login, Socket.IO updates, and a browser-based frontend.

## Run with Docker Desktop (recommended on Windows)

1. Start Docker Desktop and wait until it shows that the engine is running.
2. Open PowerShell in this project folder (the folder containing `docker-compose.yml`).
3. Build and start the app:

   ``powershell
   docker compose up --build -d
   ```

4. Open the app at <http://localhost:8081>. The backend health check is <http://localhost:4000/api/health>.
5. To see service status and logs:

   ```powershell
   docker compose ps
   docker compose logs -f
   ```

6. Stop the app with `Ctrl+C` to leave the log view, then run:

   ```powershell
   docker compose down
   ```

The SQLite database is stored in the `seer-data` Docker volume and remains there after `docker compose down`. To erase the database too, use `docker compose down -v`.

## Run without Docker

Install Node.js 20 or newer and Python 3. From the project root, open two PowerShell terminals.

**Terminal 1 — backend:**

```powershell
cd backend
npm install
npm start
```

The API listens on <http://localhost:4000>.

**Terminal 2 — frontend:**

```powershell
cd frontend
python -m http.server 8081
```

Open <http://localhost:8081> in your browser. Keep both terminals open while using the app.

## Accounts

Choose **Create account** on the login page, enter your name, mobile number or email, and a password of at least 8 characters. Choose either **Public User** or **Forest Department**. After registration, the app signs you in automatically. Later, use the same contact and password to log in. Passwords are stored as bcrypt hashes by the backend.

## Configuration

For local backend development, copy `backend/.env.example` to `backend/.env`, set a private `JWT_SECRET`, and set `OPENAI_API_KEY` to an API key from your OpenAI API account before starting the server. The vision API key stays on the backend and is never sent to the browser. Image analysis uses the configured vision model; if no key is configured, the app tries its on-device model and sends unclear results to the Forest Department for review instead of calling them safe.

Docker Compose reads `OPENAI_API_KEY` and `JWT_SECRET` from the shell environment. In PowerShell:

```powershell
$env:JWT_SECRET = 'replace-this-with-a-long-random-secret'
$env:OPENAI_API_KEY = 'your-openai-api-key'
docker compose up --build -d
```

Do not commit real secrets. The frontend defaults to `http://localhost:4000` for its API. If the backend runs on another host or port, set `window.SEER_API_BASE` in `frontend/index.html` before the app scripts load.

## Project layout

```text
backend/       Express API, auth, SQLite database, and Socket.IO
frontend/      Single-page HTML/CSS/JavaScript app
docker-compose.yml
```

## Current limitations

- Password reset is not available yet.
- Uploaded media is stored as base64 in SQLite; this is suitable for a prototype, not large-scale production use.
- Browser-based animal detection and map tiles need an internet connection to load their external libraries and data.
