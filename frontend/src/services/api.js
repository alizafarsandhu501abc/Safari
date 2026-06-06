import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('safari_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401/403 errors (e.g. expired/invalid tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('safari_token');
      localStorage.removeItem('safari_user');
      // Redirect to login page only if not already on login/register pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export function loginUser(username, password) {
  return api.post('/auth/login', { username, password });
}

export function registerUser(username, email, password) {
  return api.post('/auth/signup', { username, email, password });
}

export function getProfile() {
  return api.get('/auth/profile');
}

// ── Log Upload ──
export function uploadLogFile(file, onProgress) {
  const formData = new FormData();
  formData.append('logfile', file);

  return api.post('/logs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
}

// ── Jobs ──
export function getJobs() {
  return api.get('/logs/jobs');
}

export function getJobResults(jobId) {
  return api.get(`/logs/jobs/${jobId}`);
}

// ── Dashboard ──
export function getDashboard() {
  return api.get('/analytics/dashboard');
}

// ── Audit ──
export function getAuditLogs() {
  return api.get('/audit/logs');
}

export default api;
