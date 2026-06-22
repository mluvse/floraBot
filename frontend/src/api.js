import axios from 'axios';

// In production (Railway), VITE_API_URL is set to the backend Railway URL.
// In local dev, it's empty and Vite proxy handles /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL || '';

axios.defaults.baseURL = baseURL;

export default axios;
