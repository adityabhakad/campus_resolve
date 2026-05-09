import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // For capturing jwt cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
