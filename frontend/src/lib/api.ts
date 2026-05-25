import axios, { AxiosError } from 'axios';
import type { User, Tweet, AuthResponse, PaginatedResponse, ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Token is stored in Zustand persist storage as JSON
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear Zustand auth storage
        localStorage.removeItem('auth-storage');
        // Only redirect if not already on auth pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: FormData): Promise<{ user: User }> => {
    const response = await api.put<{ user: User }>('/auth/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Tweet API
export const tweetApi = {
  create: async (data: FormData): Promise<{ tweet: Tweet }> => {
    const response = await api.post<{ tweet: Tweet }>('/tweets', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getTimeline: async (cursor?: string): Promise<PaginatedResponse<Tweet>> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<PaginatedResponse<Tweet>>('/tweets/timeline', { params });
    return response.data;
  },

  getUserTweets: async (
    username: string,
    cursor?: string
  ): Promise<PaginatedResponse<Tweet>> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<PaginatedResponse<Tweet>>(`/tweets/user/${username}`, {
      params,
    });
    return response.data;
  },

  getTweet: async (id: string): Promise<{ tweet: Tweet }> => {
    const response = await api.get<{ tweet: Tweet }>(`/tweets/${id}`);
    return response.data;
  },

  getReplies: async (id: string, cursor?: string): Promise<PaginatedResponse<Tweet>> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<PaginatedResponse<Tweet>>(`/tweets/${id}/replies`, {
      params,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tweets/${id}`);
  },

  like: async (id: string): Promise<{ likesCount: number }> => {
    const response = await api.post<{ likesCount: number }>(`/tweets/${id}/like`);
    return response.data;
  },

  unlike: async (id: string): Promise<{ likesCount: number }> => {
    const response = await api.delete<{ likesCount: number }>(`/tweets/${id}/like`);
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async (username: string): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>(`/users/${username}`);
    return response.data;
  },

  getFollowers: async (
    username: string,
    cursor?: string
  ): Promise<PaginatedResponse<User>> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<PaginatedResponse<User>>(
      `/users/${username}/followers`,
      { params }
    );
    return response.data;
  },

  getFollowing: async (
    username: string,
    cursor?: string
  ): Promise<PaginatedResponse<User>> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<PaginatedResponse<User>>(
      `/users/${username}/following`,
      { params }
    );
    return response.data;
  },
};

// Follow API
export const followApi = {
  follow: async (username: string): Promise<{ followersCount: number }> => {
    const response = await api.post<{ followersCount: number }>(`/follows/${username}`);
    return response.data;
  },

  unfollow: async (username: string): Promise<{ followersCount: number }> => {
    const response = await api.delete<{ followersCount: number }>(`/follows/${username}`);
    return response.data;
  },
};

// Search API
export const searchApi = {
  users: async (query: string): Promise<{ users: User[] }> => {
    const response = await api.get<{ users: User[] }>('/search/users', {
      params: { q: query },
    });
    return response.data;
  },
};

// Notification API
export const notificationApi = {
  getNotifications: async (cursor?: string): Promise<{ notifications: any[]; nextCursor: string | null; hasMore: boolean }> => {
    const params = cursor ? { cursor } : {};
    const response = await api.get<{ notifications: any[]; nextCursor: string | null; hasMore: boolean }>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id?: string): Promise<void> => {
    if (id) {
      await api.put(`/notifications/${id}/read`);
    } else {
      await api.put('/notifications/read');
    }
  },
};
