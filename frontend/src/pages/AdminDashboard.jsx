import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Eye, EyeOff, Key } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('aether_token'));
    const [password, setPassword] = useState('');
    const [servers, setServers] = useState([]);
    const [newServer, setNewServer] = useState({ name: '', ip: '', type: 'Linux', isPublic: false });
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [showBrandingSettings, setShowBrandingSettings] = useState(false);
    const [passwordChange, setPasswordChange] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [branding, setBranding] = useState({ siteTitle: '', siteSubtitle: '' });

    useEffect(() => {
        if (isAuthenticated) {
            fetchServers();
            fetchBranding();
        }
    }, [isAuthenticated]);

    const fetchBranding = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setBranding(data);
        } catch (err) {
            console.error(err);
        }
    };

    const getAuthHeader = () => {
        const token = localStorage.getItem('aether_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const handleUnauthorized = () => {
        localStorage.removeItem('aether_token');
        setIsAuthenticated(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('aether_token', data.token);
                setIsAuthenticated(true);
            } else {
                alert(data.error || 'Access Denied');
            }
        } catch (err) {
            alert('Login failed');
        }
    };

    const fetchServers = async () => {
        try {
            const res = await fetch('/api/admin/servers', {
                headers: getAuthHeader()
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                setServers(data);
            } else {
                setServers([]);
            }
        } catch (err) {
            console.error(err);
            setServers([]);
        }
    };

    const handleAddServer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/servers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(newServer)
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

            if (res.ok) {
                fetchServers();
                setNewServer({ name: '', ip: '', type: 'Linux', isPublic: false });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add node');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Terminate this node connection?')) return;
        try {
            const res = await fetch(`/api/admin/servers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

            if (res.ok) {
                fetchServers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordChange.newPassword !== passwordChange.confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    oldPassword: passwordChange.oldPassword,
                    newPassword: passwordChange.newPassword
                })
            });

            if (res.status === 401 && !res.ok) {
                // If it's a genuine 401 (token invalid), logout
                // But if it's "Invalid old password", it might also be 401 depending on backend implementation
                // We checked server.js: it returns 401 for invalid old password too.
                // Let's check the error message if possible or just handle it.
                const data = await res.json();
                if (data.error === 'Invalid or expired token' || data.error === 'Authorization token required') {
                    handleUnauthorized();
                    return;
                }
                alert(data.error || 'Failed to change password');
                return;
            }

            if (res.ok) {
                alert('Password changed successfully');
                setShowPasswordChange(false);
                setPasswordChange({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to change password');
            }
        } catch (err) {
            alert('Failed to change password');
        }
    };

    const handleBrandingChange = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(branding)
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

            if (res.ok) {
                alert('Branding updated successfully');
                setShowBrandingSettings(false);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update branding');
            }
        } catch (err) {
            alert('Failed to update branding');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container">
                <div className="login-box">
                    <Shield size={48} className="admin-icon" />
                    <h2>RESTRICTED ACCESS</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="ENTER ACCESS KEY"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button type="submit">AUTHENTICATE</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>NETWORK ADMINISTRATION</h1>
                <div className="header-actions">
                    <button className="settings-btn" onClick={() => setShowBrandingSettings(!showBrandingSettings)}>
                        <Shield size={16} /> SITE SETTINGS
                    </button>
                    <button className="password-btn" onClick={() => setShowPasswordChange(!showPasswordChange)}>
                        <Key size={16} /> CHANGE PASSWORD
                    </button>
                    <button className="logout-btn" onClick={handleUnauthorized}>DISCONNECT</button>
                </div>
            </header>

            {showBrandingSettings && (
                <div className="password-change-panel branding-panel">
                    <h3>SITE BRANDING</h3>
                    <form onSubmit={handleBrandingChange}>
                        <div className="form-group">
                            <label>Site Title</label>
                            <input
                                placeholder="e.g. AetherNode Monitoring"
                                value={branding.siteTitle}
                                onChange={e => setBranding({ ...branding, siteTitle: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Site Subtitle</label>
                            <input
                                placeholder="e.g. Infrastructure Status"
                                value={branding.siteSubtitle}
                                onChange={e => setBranding({ ...branding, siteSubtitle: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">SAVE CHANGES</button>
                            <button type="button" className="cancel-btn" onClick={() => setShowBrandingSettings(false)}>CANCEL</button>
                        </div>
                    </form>
                </div>
            )}

            {showPasswordChange && (
                <div className="password-change-panel">
                    <h3>CHANGE ACCESS KEY</h3>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordChange.oldPassword}
                                onChange={e => setPasswordChange({ ...passwordChange, oldPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordChange.newPassword}
                                onChange={e => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordChange.confirmPassword}
                                onChange={e => setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn">SAVE</button>
                            <button type="button" className="cancel-btn" onClick={() => setShowPasswordChange(false)}>CANCEL</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-content">
                <div className="add-server-panel">
                    <h3>ADD NEW NODE</h3>
                    <form onSubmit={handleAddServer}>
                        <div className="form-group">
                            <input
                                placeholder="Node Name"
                                value={newServer.name}
                                onChange={e => setNewServer({ ...newServer, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                placeholder="IP Address / Hostname"
                                value={newServer.ip}
                                onChange={e => setNewServer({ ...newServer, ip: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <select
                                value={newServer.type}
                                onChange={e => setNewServer({ ...newServer, type: e.target.value })}
                            >
                                <option value="Linux">Linux Server</option>
                                <option value="Windows">Windows Server</option>
                                <option value="Database">Database</option>
                                <option value="Load Balancer">Load Balancer</option>
                            </select>
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newServer.isPublic}
                                    onChange={e => setNewServer({ ...newServer, isPublic: e.target.checked })}
                                />
                                Public Visibility
                            </label>
                        </div>
                        <button type="submit" className="add-btn"><Plus size={16} /> INITIALIZE NODE</button>
                    </form>
                </div>

                <div className="server-list-panel">
                    <h3>ACTIVE NODES</h3>
                    <div className="server-list">
                        {servers.map(server => (
                            <div key={server.id} className="server-item">
                                <div className="server-details">
                                    <strong>{server.name}</strong>
                                    <span className="server-ip">{server.ip}</span>
                                    <span className="server-badge">{server.type}</span>
                                </div>
                                <div className="server-actions">
                                    {server.isPublic ? <Eye size={16} color="#00ff88" /> : <EyeOff size={16} color="#666" />}
                                    <button onClick={() => handleDelete(server.id)} className="delete-btn">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
