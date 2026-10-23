Seer Bharat — Wildlife Safety & Alert System
A wildlife safety web application that helps the public report wildlife sightings and receive local safety alerts. Forest Department users can review reports, monitor alerts, view sighting locations on a map, and receive notifications.
Project author: Amit Sharad Pawar

Contents
- Overview
- Key Features
- Application Screens
- Technology Stack
- Project Structure
- Prerequisites
- Run with Docker
- Run Locally Without Docker
- Create an Account
- Configuration and Security
- Limitations
- Author
Overview
Seer Bharat supports wildlife-sighting reporting and safety awareness through a public-facing interface and a Forest Department workflow. Users can submit photos, locations, timestamps, and optional notes. AI-assisted analysis can provide an animal prediction, confidence estimate, risk level, and safety guidance. Forest Department users can review submitted reports and inspect sighting locations through the authorized map view.

AI predictions are estimates and should not replace assessment by an authorized Forest Department officer.
Key Features
- Role-based access: Public User and Forest Department account roles.
- Wildlife sighting reports: Submit a photo, location, time, and optional note.
- AI-assisted animal identification: View predictions and confidence estimates, plus safety guidance.
- Nearby alerts: Review reported wildlife activity and alert severity/status.
- Forest Department dashboard: Review submitted sightings and verification status.
- Map view: Authorized staff can inspect sighting locations; exact coordinates are restricted to authorized personnel.
- Notifications: Receive updates about newly reported sightings and actions requiring attention.
- Live updates: Socket.IO supports real-time application updates.
- Persistent storage: SQLite database.
- Container support: Docker Compose configuration for local setup.
Application Screens
The following screenshots are included in the [`screenshots/`](screenshots/) folder.
1. Login — Secure User Access
Choose Public User or Forest Department, then sign in or create an account.

2. Home — Wildlife Safety Dashboard
View local wildlife activity, nearby alerts, recent reports, and safety notifications.

3. Animal Report — Report Wildlife Sightings
Capture a sighting photo, record the location and time, add an optional note, and submit the report.

4. AI Analysis — Intelligent Animal Detection
Review the animal prediction, confidence score, risk level, and recommended safety precautions.

5. Alerts — Wildlife Safety Alerts
Read wildlife alerts, review severity and status, and open the safe map.

6. Forest Department — Active Alerts
Review submitted sightings, confidence scores, and report verification status.

7. Forest Department — Live Map
View wildlife report locations. Exact coordinates are restricted to authorized personnel.

8. Forest Department — Notifications
Receive notifications about newly reported wildlife sightings and review required actions.

Technology Stack
Component	Technology
Frontend	HTML, CSS, JavaScript
Backend	Node.js, Express
Database	SQLite
Authentication	JWT and bcrypt password hashing
Live updates	Socket.IO
Deployment	Docker Compose, or local Node.js and Python HTTP server
Animal analysis	Configured vision API, with an on-device fallback when no API key is configured


Project Structure
Seer-Bharat/
├── backend/                # Express API, authentication, SQLite, Socket.IO
├── frontend/               # Single-page HTML/CSS/JavaScript application
├── screenshots/            # README application screenshots
├── docker-compose.yml      # Docker service configuration
└── README.md
The backend may also contain an .env.example file for local configuration. Keep any real .env file and secrets out of version control.
Prerequisites
Choose one of the following setup methods:

Docker method
- Docker Desktop installed and running.
Local method
- Node.js 20 or newer.
- Python 3.
- PowerShell or a terminal.
Run with Docker
These instructions are for Windows PowerShell.
1. Install and start Docker Desktop. Wait until the Docker engine is running.
2. Open PowerShell in the project root—the directory containing docker-compose.yml.
3. Set your own private environment values:
$env:JWT_SECRET = 'replace-with-a-long-random-secret'
$env:OPENAI_API_KEY = 'your-openai-api-key'
docker compose up --build -d
4. Open the frontend:
   http://localhost:8081
5. Check the backend health endpoint:
   http://localhost:4000/api/health
Check service status and follow logs:
docker compose ps
docker compose logs -f
Stop the services:
docker compose down
The seer-data Docker volume keeps the SQLite database. To remove the database volume as well, run:
docker compose down -v
This removes the persisted volume data, so use it only if you intend to erase the database.
Run Locally Without Docker
Install Node.js 20 or newer and Python 3. Open two terminal windows in the project root.
Terminal 1 — Backend
cd backend
npm install
npm start
Terminal 2 — Frontend
From the project root, run:
cd frontend
python -m http.server 8081
Open http://localhost:8081 in your browser. Keep both terminals running while using the application.
Create an Account
1. Select Create account.
2. Enter your name, mobile number or email, and a password of at least 8 characters.
3. Choose Public User or Forest Department.
4. Registration signs you in automatically.
5. For later sessions, sign in using the same contact information and password.
Only use the Forest Department role in accordance with the project's intended authorization and access rules.
Configuration and Security
- For local backend development, copy backend/.env.example to backend/.env if that example file is present.
- Set a private, strong JWT_SECRET.
- Add OPENAI_API_KEY only if you want API-based image analysis.
- Keep API keys and secrets on the backend. Never commit .env files, passwords, tokens, or API keys to GitHub.
- If no vision API key is configured, the app attempts its on-device model; unclear results are sent for Forest Department review.
- Treat AI confidence as an estimate, not a definitive identification.
- Protect wildlife location information and limit access to authorized personnel.
Before production deployment, review authorization, data retention, upload limits, monitoring, and location privacy.
Limitations
- Password reset is not currently available.
- Uploaded media is stored as base64 in SQLite; this is suitable for a prototype, not large-scale production.
- Browser-based animal detection and map tiles require an internet connection for external libraries and data.
- AI predictions may be uncertain and require review by an authorized officer.
- Production use requires additional review of security, authorization, data retention, monitoring, upload limits, and location privacy.
Author
Amit Sharad Pawar

Created as a wildlife safety and alert system project.
