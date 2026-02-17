# AetherNode - OpenSource Monitoring

A modern, lightweight, and secure server monitoring solution designed for transparency and ease of use.

![Design Preview](https://via.placeholder.com/800x400?text=Arctic+Glass+Design+System)

## Features

- **Arctic Glass Design**: A clean, modern UI with glassmorphism effects and responsive layouts.
- **Dynamic Branding**: Customize your site title and subtitle directly from the admin dashboard.
- **Secure by Design**:
  - JWT-based authentication for all admin operations.
  - Password hashing using Bcrypt.
  - SSRF protection for node registration.
- **Real-time Metrics**: Monitor CPU, RAM, and Disk usage with live updates.
- **Public & Private Nodes**: Choose which servers are visible to the public.

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
The server will run on `http://localhost:3001`. Default admin password is `admin123`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

### 4. Agent Installation
Deploy the `agent.js` to the servers you want to monitor.
```bash
node agent.js
```

## Configuration

Login to the `/admin` area to:
- Change the site title and subtitle.
- Register new monitoring nodes.
- Update your security credentials.

## License

All rights reserved to AetherNode Monitoring. This project is provided "as is" for community use and infrastructure transparency.

---
*Created by AetherNode - Monitoring*
