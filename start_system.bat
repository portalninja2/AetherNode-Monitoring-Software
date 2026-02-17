@echo off
echo Starting AetherNode Monitoring System...

start "AetherNode Backend" cmd /k "cd backend && npm start"
start "AetherNode Frontend" cmd /k "cd frontend && npm run dev"

echo System initialized. Access frontend at http://localhost:5173
