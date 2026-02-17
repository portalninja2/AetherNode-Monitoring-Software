import React from 'react';
import './SystemStatus.css';

const SystemStatus = ({ systemStatus = 'UNKNOWN', lastUpdated }) => {
    const statusColor = systemStatus === 'ONLINE' ? 'status-online' : systemStatus === 'PARTIAL OUTAGE' ? 'status-warning' : 'status-offline';

    return (
        <div className="system-status-container">
            <div className="system-status-content">
                <span className="system-status-label">GLOBAL STATUS: <span className={statusColor}>{systemStatus}</span></span>
            </div>
            {lastUpdated && (
                <div className="last-updated">
                    Updated: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default SystemStatus;
