const os = require('os');
const http = require('http');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CONFIG = {
    PORT: 3002, // Port for this agent to listen on
    API_KEY: 'secret-agent-key', // Simple auth key
    SERVER_NAME: os.hostname(),
    IS_PUBLIC: true // Default visibility
};

const { execSync } = require('child_process');

// Helper to get Disk Usage (Real system calls)
const getDiskUsage = () => {
    try {
        if (os.platform() === 'win32') {
            // Windows: use wmic to get disk info
            const output = execSync('wmic logicaldisk get size,freespace,caption').toString();
            const lines = output.trim().split('\n').slice(1);
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3 && parts[2].startsWith('C:')) {
                    const free = parseInt(parts[0]);
                    const total = parseInt(parts[1]);
                    return {
                        total: Math.round(total / (1024 ** 3)),
                        used: Math.round((total - free) / (1024 ** 3)),
                        unit: 'GB'
                    };
                }
            }
        } else {
            // Linux/macOS: use df
            const output = execSync('df -B1 /').toString();
            const lines = output.trim().split('\n');
            const parts = lines[1].replace(/\s+/g, ' ').split(' ');
            const total = parseInt(parts[1]);
            const used = parseInt(parts[2]);
            return {
                total: Math.round(total / (1024 ** 3)),
                used: Math.round(used / (1024 ** 3)),
                unit: 'GB'
            };
        }
    } catch (e) {
        console.error("Disk usage detection failed, falling back to mock:", e.message);
    }
    return { total: 100, used: 20, unit: 'GB' };
};

// Accurate CPU usage calculation using delta between two samples
let lastCpuUpdate = Date.now();
let lastCpuInfo = os.cpus().map(cpu => cpu.times);

const getCpuUsageSnapshot = () => {
    const currentCpuInfo = os.cpus().map(cpu => cpu.times);
    let totalDiff = 0;
    let idleDiff = 0;

    for (let i = 0; i < currentCpuInfo.length; i++) {
        const last = lastCpuInfo[i];
        const current = currentCpuInfo[i];

        const lastTotal = Object.values(last).reduce((a, b) => a + b, 0);
        const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);

        totalDiff += (currentTotal - lastTotal);
        idleDiff += (current.idle - last.idle);
    }

    const usage = totalDiff > 0 ? (1 - (idleDiff / totalDiff)) * 100 : 0;

    // Update reference for next call
    lastCpuInfo = currentCpuInfo;
    lastCpuUpdate = Date.now();

    return Math.min(100, Math.max(0, usage));
};

const getSystemStats = () => {
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;

    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    const cpuUsage = getCpuUsageSnapshot();
    const disk = getDiskUsage();

    return {
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        platform: os.platform(),
        cpu: {
            model: cpuModel,
            cores: cpuCount,
            usage: cpuUsage
        },
        memory: {
            total: (totalMem / (1024 ** 3)).toFixed(1) + ' GB',
            used: (usedMem / (1024 ** 3)).toFixed(1) + ' GB',
            percentage: memPercentage
        },
        storage: {
            total: disk.total + ' ' + disk.unit,
            used: disk.used + ' ' + disk.unit,
            percentage: Math.round((disk.used / disk.total) * 100)
        }
    };
};

const server = http.createServer((req, res) => {
    // Enable CORS for dashboard access (if accessing directly)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/stats') {
        // Simple auth check
        // if (req.headers['x-api-key'] !== CONFIG.API_KEY) {
        //     res.statusCode = 401;
        //     return res.end(JSON.stringify({ error: 'Unauthorized' }));
        // }

        const stats = getSystemStats();
        res.end(JSON.stringify(stats));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(CONFIG.PORT, () => {
    console.log(`AetherNode Agent running on port ${CONFIG.PORT}`);
    console.log(`Machine: ${CONFIG.SERVER_NAME} (${os.platform()})`);
});
