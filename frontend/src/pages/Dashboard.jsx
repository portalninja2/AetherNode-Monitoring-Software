import React, { useEffect, useState } from 'react';
import ServerCard from '../components/ServerCard';
import Hero from '../components/Hero';
import SystemStatus from '../components/SystemStatus';
import './Dashboard.css';

const Dashboard = () => {
    const [servers, setServers] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [systemStatus, setSystemStatus] = useState('UNKNOWN');
    const [branding, setBranding] = useState({ siteTitle: 'AetherNode Monitoring', siteSubtitle: 'System Status Overview' });

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setBranding(data);
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setServers(data);
            setLastUpdated(new Date());

            // Calculate overall status
            // If any server is offline (though in public view we might only see 'online' if we filter),
            // let's assume if 0 servers -> UNKNOWN or MAINTENANCE
            if (data.length === 0) setSystemStatus('MAINTENANCE');
            else setSystemStatus('ONLINE');
        } catch (error) {
            console.error('Error fetching status:', error);
            setSystemStatus('SYSTEM ERROR');
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5 seconds polling for live feel
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-container">
            <Hero title={branding.siteTitle} subtitle={branding.siteSubtitle} />

            <SystemStatus systemStatus={systemStatus} lastUpdated={lastUpdated} />

            <div className="servers-grid">
                {servers.map(server => (
                    <ServerCard key={server.id} {...server} />
                ))}
            </div>

            {servers.length === 0 && (
                <div className="no-data">
                    <p>No public nodes active. Systems initializing...</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
