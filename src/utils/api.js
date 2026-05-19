import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle responses and check for banned users
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If user is banned (403 with suspension message), log them out
        if (error.response?.status === 403 &&
            error.response?.data?.error?.includes('suspended')) {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login page
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
