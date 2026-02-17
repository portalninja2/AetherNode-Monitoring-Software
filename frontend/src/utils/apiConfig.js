// API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.BACKEND_URL || '';

export const getBackendUrl = () => {
    return BACKEND_URL;
};

export const isBackendConfigured = () => {
    return !!BACKEND_URL;
};

export const apiRequest = async (endpoint, options = {}) => {
    const backendUrl = getBackendUrl();

    if (!backendUrl) {
        throw new Error('Backend URL not configured. Please set VITE_BACKEND_URL environment variable.');
    }

    const url = `${backendUrl}${endpoint}`;
    return fetch(url, options);
};
