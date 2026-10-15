import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const apiClient = axios.create({ baseURL: API_URL });

let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let refreshRequest;

apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.url?.endsWith('/auth/refresh')) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export function setTokens(tokens) {
  accessToken = tokens?.accessToken || null;
  refreshToken = tokens?.refreshToken || null;
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  else localStorage.removeItem('accessToken');
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  else localStorage.removeItem('refreshToken');
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken() {
  if (!refreshToken) return null;
  if (!refreshRequest) {
    refreshRequest = apiClient.post('/auth/refresh', { refreshToken })
      .then((response) => {
        const result = response.data;
        if (!result.success) throw new Error(result.message || 'Your session has expired');
        setTokens(result.data);
        return result.data.accessToken;
      })
      .catch(() => {
        setTokens(null);
        return null;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

function queryParams(query) {
  return Object.fromEntries(
    Object.entries(query || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function requestError(error) {
  return new Error(
    error.response?.data?.message
      || `Request failed (${error.response?.status || 'network error'})`,
  );
}

export async function request(path, { method = 'GET', body, query, retry = true } = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method,
      data: body,
      params: queryParams(query),
      paramsSerializer: (params) => new URLSearchParams(params).toString(),
    });
    const result = response.data;
    if (!result?.success) throw new Error(result?.message || 'Request failed');
    return result;
  } catch (error) {
    if (error.response?.status === 401 && retry && refreshToken && !path.startsWith('/auth/')) {
      const token = await refreshAccessToken();
      if (token) return request(path, { method, body, query, retry: false });
    }
    throw error.response ? requestError(error) : error;
  }
}

export async function login(credentials) {
  const result = await request('/auth/login', { method: 'POST', body: credentials, retry: false });
  setTokens(result.data);
  return result.data;
}

export async function logout() {
  const currentRefreshToken = refreshToken;
  try {
    if (currentRefreshToken) {
      await request('/auth/logout', {
        method: 'POST',
        body: { refreshToken: currentRefreshToken },
        retry: false,
      });
    }
  } finally {
    setTokens(null);
  }
}
