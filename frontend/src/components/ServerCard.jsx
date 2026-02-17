import React from 'react';
import { Activity, Cpu, HardDrive, Server } from 'lucide-react';
import './ServerCard.css';

const ServerCard = ({ name, type, status, metrics, isPublic, specs }) => {
    const isOnline = status === 'online';

    return (
        <div className={`server-card ${isOnline ? 'online' : 'offline'}`}>
            <div className="card-header">
                <div className="server-icon">
                    <Server size={24} />
                </div>
                <div className="server-info">
                    <h3>{name}</h3>
                    <span className="server-type">{type}</span>
                    {(metrics?.cpuModel || specs?.cpu) && (
                        <div className="server-specs">
                            <div className="spec-row" title={metrics?.cpuModel || specs?.cpu}>
                                {metrics?.cpuModel || specs.cpu}
                            </div>
                            {(metrics?.cores || specs?.cores) && (
                                <div className="spec-row sub-spec">
                                    {metrics?.cores || specs.cores} Cores
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className={`status-indicator ${status}`}>
                    {status}
                </div>
            </div>

            <div className="card-body">
                <div className="metric">
                    <div className="metric-header">
                        <Cpu size={16} />
                        <span>CPU</span>
                    </div>
                    <div className="metric-bar-container">
                        <div
                            className="metric-bar"
                            style={{ width: `${metrics?.cpu || 0}%`, backgroundColor: getStatusColor(metrics?.cpu) }}
                        ></div>
                    </div>
                    <span className="metric-value">{metrics?.cpu || 0}%</span>
                </div>

                <div className="metric-group">
                    <div className="metric">
                        <div className="metric-header">
                            <HardDrive size={16} />
                            <span>RAM</span>
                        </div>
                        <div className="metric-bar-container">
                            <div
                                className="metric-bar"
                                style={{ width: `${metrics?.ram || 0}%`, backgroundColor: getStatusColor(metrics?.ram) }}
                            ></div>
                        </div>
                        <span className="metric-value">{metrics?.ram || 0}%</span>
                    </div>
                    {metrics?.ramDetails && (
                        <div className="metric-details">
                            <span>Used: {metrics.ramDetails.used}</span>
                            <span>Free: {metrics.ramDetails.free}</span>
                            <span>Max: {metrics.ramDetails.total}</span>
                        </div>
                    )}
                </div>

                <div className="metric-group">
                    <div className="metric">
                        <div className="metric-header">
                            <HardDrive size={16} />
                            <span>DISK</span>
                        </div>
                        <div className="metric-bar-container">
                            <div
                                className="metric-bar"
                                style={{ width: `${metrics?.storage || 0}%`, backgroundColor: getStatusColor(metrics?.storage) }}
                            ></div>
                        </div>
                        <span className="metric-value">{metrics?.storage || 0}%</span>
                    </div>
                    {metrics?.storageDetails && (
                        <div className="metric-details">
                            <span>Used: {metrics.storageDetails.used}</span>
                            <span>Free: {metrics.storageDetails.free}</span>
                            <span>Total: {metrics.storageDetails.total}</span>
                        </div>
                    )}
                </div>

                <div className="metric">
                    <div className="metric-header">
                        <Activity size={16} />
                        <span>NET</span>
                    </div>
                    <span className="metric-value-text">{metrics?.network || 0} Mbps</span>
                </div>
            </div>
        </div>
    );
};

// Helper for color based on load
const getStatusColor = (value) => {
    if (value > 90) return '#ff0055'; // Critical
    if (value > 70) return '#ffd700'; // Warning
    return '#00ff88'; // Good
};

export default ServerCard;
