const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3001;
const VERSION = "1.0.1-debug";

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Version Endpoint
app.get('/api/version', (req, res) => {
    res.json({ version: VERSION, status: "running" });
});

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const DATA_FILE = path.join(DATA_DIR, 'servers.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Initialize servers.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Initialize settings.json
if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultPassword = "admin123";
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ adminPassword: hashedPassword }, null, 2));
}

// Helper to read servers
const getServers = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading servers file:", err);
        return [];
    }
};

// Helper to save servers
const saveServers = (servers) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(servers, null, 2));
};

// Helper to read settings
const getSettings = () => {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return { adminPassword: "admin123" };
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        const settings = JSON.parse(data);
        // Ensure defaults exist
        if (!settings.adminPassword) settings.adminPassword = "admin123";
        if (!settings.siteTitle) settings.siteTitle = "AetherNode Monitoring";
        if (!settings.siteSubtitle) settings.siteSubtitle = "System Status Overview";
        return settings;
    } catch (err) {
        console.error("Error reading settings:", err);
        return {
            adminPassword: "admin123",
            siteTitle: "AetherNode Monitoring",
            siteSubtitle: "System Status Overview"
        };
    }
};

// Helper to save settings
const saveSettings = (settings) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

const JWT_SECRET = process.env.JWT_SECRET || 'aether-secret-dev-only-123';

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const isPrivateIP = (ip) => {
    // Simple check for localhost and common private ranges
    // In a real production environment, use a robust library like 'ipaddr.js'
    const privatePatterns = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^localhost$/i,
        /^::1$/
    ];
    return privatePatterns.some(pattern => pattern.test(ip));
};

const axios = require('axios');

// Global Stats Cache
let statsCache = {};

// Helper to fetch metrics from a single server
const fetchServerMetrics = async (server) => {
    try {
        const url = `http://${server.ip}${server.ip.includes(':') ? '' : ':3002'}/stats`;
        const response = await axios.get(url, { timeout: 3000 });
        const stats = response.data;

        return {
            id: server.id,
            name: server.name,
            status: 'online',
            type: server.type,
            metrics: {
                cpu: Math.round(stats.cpu.usage),
                cpuModel: stats.cpu.model,
                cores: stats.cpu.cores,
                ramDetails: {
                    total: stats.memory.total,
                    used: stats.memory.used,
                    free: (parseFloat(stats.memory.total) - parseFloat(stats.memory.used)).toFixed(1) + ' GB'
                },
                ram: stats.memory.percentage,
                storageDetails: {
                    total: stats.storage.total,
                    used: stats.storage.used,
                    free: (parseFloat(stats.storage.total) - parseFloat(stats.storage.used)).toFixed(1) + ' GB'
                },
                storage: stats.storage.percentage,
                network: Math.floor(Math.random() * 100) // Mock network for now as agent doesn't send it yet
            },
            lastUpdated: new Date()
        };
    } catch (err) {
        console.error(`Error fetching from ${server.name} (${server.ip}):`, err.message);
        return {
            id: server.id,
            name: server.name,
            status: 'offline',
            type: server.type,
            metrics: null,
            lastUpdated: new Date()
        };
    }
};

// Background Poller
const startMonitoring = () => {
    setInterval(async () => {
        const servers = getServers();
        const results = await Promise.all(servers.map(fetchServerMetrics));

        results.forEach(res => {
            statsCache[res.id] = res;
        });
    }, 10000); // Poll every 10 seconds
};

startMonitoring();

// Public Status Endpoint (Sanitized - NO IPs)
app.get('/api/status', (req, res) => {
    const servers = getServers();
    const publicServers = servers.filter(s => s.isPublic);

    const results = publicServers.map(server => {
        return statsCache[server.id] || {
            id: server.id,
            name: server.name,
            status: 'offline',
            metrics: null,
            lastUpdated: null
        };
    });

    res.json(results);
});

// Public Branding Settings
app.get('/api/settings', (req, res) => {
    const settings = getSettings();
    res.json({
        siteTitle: settings.siteTitle,
        siteSubtitle: settings.siteSubtitle
    });
});

// Admin: Update Settings
app.post('/api/admin/settings', authMiddleware, (req, res) => {
    const { siteTitle, siteSubtitle } = req.body;
    const settings = getSettings();

    if (siteTitle) settings.siteTitle = siteTitle;
    if (siteSubtitle) settings.siteSubtitle = siteSubtitle;

    saveSettings(settings);
    res.json({ success: true, settings: { siteTitle: settings.siteTitle, siteSubtitle: settings.siteSubtitle } });
});

// LOGIN Endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const settings = getSettings();

    // Sanitize logging: Do NOT log the password content or length in a way that leaks info
    console.log(`[${new Date().toISOString()}] LOGIN ATTEMPT - Request received`);

    if (password && bcrypt.compareSync(password, settings.adminPassword)) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Change Password Endpoint
app.post('/api/admin/change-password', authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const settings = getSettings();

    if (!bcrypt.compareSync(oldPassword, settings.adminPassword)) {
        return res.status(401).json({ error: 'Invalid old password' });
    }

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    settings.adminPassword = bcrypt.hashSync(newPassword, 10);
    saveSettings(settings);
    res.json({ success: true });
});

// Admin: List All Servers (Includes IPs)
app.get('/api/admin/servers', authMiddleware, (req, res) => {
    const servers = getServers();
    res.json(servers);
});

// Admin: Add Server
app.post('/api/admin/servers', authMiddleware, (req, res) => {
    const { name, ip, type, isPublic } = req.body;
    if (!name || !ip) {
        return res.status(400).json({ error: 'Name and IP are required' });
    }

    // SSRF Protection: Prevent adding internal/private IPs
    if (isPrivateIP(ip)) {
        return res.status(400).json({ error: 'Publicly reachable IP or hostname required' });
    }

    const servers = getServers();
    const newServer = {
        id: Date.now().toString(),
        name,
        ip,
        type: type || 'Linux',
        isPublic: isPublic !== undefined ? isPublic : false,
        createdAt: new Date()
    };

    servers.push(newServer);
    saveServers(servers);

    res.status(201).json(newServer);
});

// Admin: Delete Server
app.delete('/api/admin/servers/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    let servers = getServers();
    servers = servers.filter(s => s.id !== id);
    saveServers(servers);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
