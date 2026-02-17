# AetherNode Monitoring - Deployment Guide

This guide explains how to deploy AetherNode Monitoring using Git and Coolify/Docker.

## 📦 Repository Structure for Deployment

-   **Backend**: `/backend` (Has its own Dockerfile)
-   **Frontend**: `/frontend` (Has its own Dockerfile)

---

## 🚀 Option 1: Full Stack Setup (Recommended for Initial Setup)
*Deploys both Frontend and Backend as separate services.*

### Step 1: Deploy Backend

1.  **In Coolify**, create a new Resource > **Git Repository**.
2.  Select your repository: `https://github.com/portalninja2/aethernode-monitoring.git`
3.  **Build Pack**: Select **Dockerfile**.
4.  **Base Directory**: `backend` (ohne führenden Slash!)
5.  **Dockerfile Location**: `Dockerfile` (genau so, relativ zum Base Directory)
6.  **Port**: `3001`
7.  **Persistent Storage**:
    -   **Source** (Host): `/data/coolify/aethernode-backend` (oder ein anderer Pfad deiner Wahl)
    -   **Destination** (Container): `/app/data`
    -   Dies speichert `servers.json` und `settings.json` persistent.
8.  **Domain** (optional): Set a domain like `api.yourdomain.com`
9.  **Deploy** and wait for it to finish.

> **Troubleshooting**: Falls Coolify das Dockerfile nicht findet, versuche:
> - Base Directory: `./backend` oder `/backend`
> - Oder in manchen Coolify-Versionen: Dockerfile Location: `backend/Dockerfile` mit Base Directory leer lassen

### Step 2: Deploy Frontend

1.  **In Coolify**, create another new Resource > **Git Repository**.
2.  Select the same repository.
3.  **Build Pack**: Select **Dockerfile**.
4.  **Base Directory**: `frontend`
5.  **Dockerfile Location**: `Dockerfile`
6.  **Port**: `80`
7.  **Domain**: Set your main domain like `monitoring.aethernode.de`
8.  **Deploy** (wird erstmal fehlschlagen wegen fehlender Backend-URL - das ist OK!)

#### Nach dem ersten Deployment: nginx.conf konfigurieren

9.  **Erstelle eine custom nginx.conf auf deinem Coolify-Server**:
    ```bash
    mkdir -p /data/coolify/aethernode-frontend
    nano /data/coolify/aethernode-frontend/nginx.conf
    ```

10. **Inhalt der nginx.conf** (ersetze die Backend-URL):
    ```nginx
    server {
        listen 80;
        
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass https://api.aethernode.de/api/;  # DEINE BACKEND URL HIER
            proxy_set_header Host api.aethernode.de;    # WICHTIG: Die Backend-Domain!
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

11. **In Coolify: Persistent Storage hinzufügen**:
    -   **Source** (Host): `/data/coolify/aethernode-frontend/nginx.conf`
    -   **Destination** (Container): `/etc/nginx/conf.d/default.conf`

12. **Redeploy** - Jetzt sollte alles funktionieren!

---

## 🖥️ Option 2: Frontend Only
*If you have the backend running elsewhere and just want the dashboard.*

1.  **In Coolify**, create a new Resource > **Git Repository**.
2.  **Build Pack**: Select **Dockerfile**.
3.  **Base Directory**: `/frontend`.
4.  **Port**: `80`
5.  **Erstelle custom nginx.conf** wie in Option 1, Schritt 9-11 beschrieben
6.  **Deploy**.

---

## ⚙️ Option 3: Backend Only (The Hub)
*If you want to host the data aggregator separately.*

1.  **In Coolify**, create a new Resource > **Git Repository**.
2.  **Build Pack**: Select **Dockerfile**.
3.  **Base Directory**: `/backend`.
4.  **Port**: `3001`
5.  **Persistent Storage**:
    -   Add a volume: `/app/data` → Map to persistent storage
    -   This ensures your `servers.json` and `settings.json` survive restarts.
6.  **Deploy**.

---

## 🔌 Connecting Remote Agents
To monitor a server, you need to run the Agent on it. This requires **Node.js**.

### How to install Node.js

#### On Linux (Ubuntu/Debian) - Recommended
```bash
# Update package list
sudo apt update

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
```

#### On Windows
1. Download the **LTS** installer from [nodejs.org](https://nodejs.org/).
2. Run the `.msi` file and follow the instructions.

#### On Docker
Use the official image in your `Dockerfile`: `FROM node:18-alpine`.

---

### Running the Agent
1.  **Copy the Agent**: Copy `backend/agent.js` to your target server.
2.  **Install Node.js**: Ensure Node.js is installed on the target machine.
3.  **Run it**: 
    ```bash
    # Simple start
    node agent.js
    
    # Or with PM2 (recommended)
    npm install -g pm2
    pm2 start agent.js --name "aether-agent"
    ```
4.  **Firewall**: Open Port **3002** (TCP) for the IP of your monitoring backend.

### Adding the Server to the Dashboard
1. Go to your **Admin Dashboard** (`/admin`).
2. Login with your password (default: `admin123`).
3. Fill out the "Add New Node" form:
   - **Node Name**: A friendly name (e.g. "Main Database")
   - **IP / Hostname**: The IP or Domain of the server where the agent is running.
   - **Type**: Select Linux/Windows/Docker.
   - **Public**: Check this if you want it to appear on the public dashboard.
4. Click **Add Server**. It will take up to 10 seconds for the first status to appear.
