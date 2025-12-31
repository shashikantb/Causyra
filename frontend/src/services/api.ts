import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LogSource {
  id: string;
  path: string;
  type: string;
  status: string;
}

export interface Application {
  id: string;
  name: string;
  type: string;
  created_at: string;
  log_sources: LogSource[];
}

export interface Incident {
  id: string;
  app_id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  timestamp: string;
  root_cause?: string;
  log_path?: string;
  log_line?: string;
  solutions?: string[];
  occurrences?: number;
  first_seen?: string;
  last_seen?: string;
  tag?: string;
}

export interface RCAResult {
  root_cause: string;
  confidence: number;
  evidence: string[];
  solutions: string[];
}

export interface LogEntry {
  timestamp: string;
  content: string;
  source: string;
}

export interface LogSummary {
  counts: Record<string, number>;
  last_seen: string | null;
}

export interface User {
  username: string;
  email?: string;
  role: string;
  allowed_apps?: string[];
}

export const AuthService = {
  login: async (username: string, password: string): Promise<string> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<{ access_token: string }>('/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.access_token;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const UserService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
  
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  createUser: async (username: string, email: string, password: string, role: string): Promise<User> => {
    const response = await api.post<User>('/users', { username, email, password, role });
    return response.data;
  },

  changeOwnPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put('/users/me/password', { old_password: oldPassword, new_password: newPassword });
  },

  changeUserPassword: async (username: string, newPassword: string): Promise<void> => {
    await api.put(`/users/${username}/password`, { new_password: newPassword });
  },

  updateUserScope: async (username: string, allowedApps: string[]): Promise<void> => {
    await api.put(`/users/${username}/scope`, { allowed_apps: allowedApps });
  },

  updateUserRole: async (username: string, role: string): Promise<void> => {
    await api.put(`/users/${username}/role`, { role });
  }
};

export const AppService = {
  createApplication: async (name: string, type: string): Promise<Application> => {
    const response = await api.post<Application>('/applications', { name, type });
    return response.data;
  },

  getApplications: async (): Promise<Application[]> => {
    const response = await api.get<Application[]>('/applications');
    return response.data;
  },

  deleteApplication: async (appId: string): Promise<void> => {
    await api.delete(`/applications/${appId}`);
  },

  getIncidents: async (appId: string, tag?: string): Promise<Incident[]> => {
    const response = await api.get<Incident[]>(`/applications/${appId}/incidents${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`);
    return response.data;
  },

  getLogSources: async (appId: string): Promise<LogSource[]> => {
    const response = await api.get<LogSource[]>(`/applications/${appId}/logs`);
    return response.data;
  },

  getRecentLogsBySource: async (appId: string): Promise<Record<string, LogEntry[]>> => {
    const response = await api.get<Record<string, LogEntry[]>>(`/applications/${appId}/logs/recent_by_source`);
    return response.data;
  },

  getLogSummary: async (appId: string): Promise<LogSummary> => {
    const response = await api.get<LogSummary>(`/applications/${appId}/logs/summary`);
    return response.data;
  },

  getRecentLogs: async (appId: string): Promise<LogEntry[]> => {
    const response = await api.get<LogEntry[]>(`/applications/${appId}/logs/recent`);
    return response.data;
  },

  setIncidentTag: async (appId: string, incidentId: string, tag: string | null): Promise<void> => {
    await api.post(`/applications/${appId}/incidents/${incidentId}/tag`, { tag });
  },

  analyzeLogs: async (logs: string): Promise<RCAResult> => {
    const response = await api.post<RCAResult>('/rca/analyze', { log_content: logs });
    return response.data;
  },

  addLogSource: async (appId: string, path: string): Promise<LogSource> => {
    const response = await api.post<LogSource>(`/applications/${appId}/logs`, { path, type: 'FILE' });
    return response.data;
  },

  deleteLogSource: async (appId: string, sourceId: string): Promise<void> => {
    await api.delete(`/applications/${appId}/logs/${sourceId}`);
  }
};
