import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para inyectar token y organización activa
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('querylens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeOrgId = localStorage.getItem('querylens_active_org_id');
    if (activeOrgId) {
      config.headers['X-Organization-Id'] = activeOrgId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores globales (ej: 401 de expiración de token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar credenciales y redirigir a login si expira
      localStorage.removeItem('querylens_token');
      localStorage.removeItem('querylens_active_org_id');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/signup' &&
        !window.location.pathname.startsWith('/shared/dashboard')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
