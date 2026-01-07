// API Configuration and HTTP Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
export const getAccessToken = (): string | null => {
  return localStorage.getItem('skillloop_access_token');
};

export const setTokens = (accessToken: string, idToken?: string) => {
  localStorage.setItem('skillloop_access_token', accessToken);
  if (idToken) {
    localStorage.setItem('skillloop_id_token', idToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('skillloop_access_token');
  localStorage.removeItem('skillloop_id_token');
  localStorage.removeItem('skillloop_user');
};

// Generic fetch wrapper with auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearTokens();
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  availability?: string[];
  credits: number;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  priority: number;
  type: 'teaching' | 'learning';
  created_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_score: number;
  common_skills: string[];
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  matched_user?: User;
}

export interface Session {
  id: string;
  title: string;
  user_id: string;
  participant_id: string;
  participant_name: string;
  skill: string;
  date: string;
  time: string;
  duration: number;
  credits_amount: number;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'rejected';
  type: 'teaching' | 'learning';
  rating?: number;
  feedback?: string;
  rated_by?: string;
  created_at: string;
  updated_at: string;
}

// Credit rates for sessions
export const CREDIT_RATES: Record<number, number> = {
  15: 5,   // 15 min = 5 credits
  30: 10,  // 30 min = 10 credits
  60: 20,  // 60 min = 20 credits
};

export interface CreditTransaction {
  id: string;
  user_id: string;
  session_id?: string;
  amount: number;
  transaction_type: string;
  description?: string;
  balance_after: number;
  created_at: string;
}

// Auth API
export const authApi = {
  getLoginUrl: () => `${API_BASE_URL}/api/auth/login`,
  
  handleCallback: async (code: string, state: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/callback?code=${code}&state=${state}`
    );
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    return response.json();
  },

  logout: async () => {
    const token = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, { headers });
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    return response.json() as Promise<{ logout_url: string }>;
  },
};

// Users API
export const usersApi = {
  getMe: () => fetchWithAuth<User>('/api/users/me'),
  
  updateMe: (data: Partial<User>) => 
    fetchWithAuth<User>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getUser: (userId: string) => fetchWithAuth<User>(`/api/users/${userId}`),
  
  getAllUsers: (skip = 0, limit = 100) => 
    fetchWithAuth<User[]>(`/api/users?skip=${skip}&limit=${limit}`),
};

// Skills API
export const skillsApi = {
  getMySkills: () => fetchWithAuth<Skill[]>('/api/skills/'),
  
  createSkill: (data: Omit<Skill, 'id' | 'user_id' | 'created_at'>) =>
    fetchWithAuth<Skill>('/api/skills/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  deleteSkill: (skillId: string) =>
    fetchWithAuth<void>(`/api/skills/${skillId}`, { method: 'DELETE' }),
  
  getUserSkills: (userId: string) => 
    fetchWithAuth<Skill[]>(`/api/skills/user/${userId}`),
  
  getCategories: () => fetchWithAuth<string[]>('/api/skills/categories'),
};

// Potential Match from find endpoint
export interface PotentialMatch {
  user: User;
  match_score: number;
  common_skills: string[];
  they_can_teach: string[];
  they_want_to_learn: string[];
}

// Connection/Match types
export interface ConnectionUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  rating?: number;
}

export interface SentRequest {
  id: string;
  matched_user: ConnectionUser;
  match_score: number;
  common_skills: string[];
  status: string;
  created_at: string;
}

export interface ReceivedRequest {
  id: string;
  sender: ConnectionUser;
  match_score: number;
  common_skills: string[];
  status: string;
  created_at: string;
}

export interface Connection {
  id: string;
  user: ConnectionUser;
  match_score: number;
  common_skills: string[];
  connected_at: string;
}

// Matches API
export const matchesApi = {
  getMatches: () => fetchWithAuth<Match[]>('/api/matches'),
  
  findPotentialMatches: () => fetchWithAuth<PotentialMatch[]>('/api/matches/find'),
  
  getSentRequests: () => fetchWithAuth<SentRequest[]>('/api/matches/sent'),
  
  getReceivedRequests: () => fetchWithAuth<ReceivedRequest[]>('/api/matches/received'),
  
  getConnections: () => fetchWithAuth<Connection[]>('/api/matches/connections'),
  
  createMatch: (data: { matched_user_id: string; match_score: number; common_skills: string[] }) =>
    fetchWithAuth<Match>('/api/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  acceptMatch: (matchId: string) =>
    fetchWithAuth<Match>(`/api/matches/${matchId}/accept`, { method: 'POST' }),
  
  rejectMatch: (matchId: string) =>
    fetchWithAuth<Match>(`/api/matches/${matchId}/reject`, { method: 'POST' }),
  
  cancelRequest: (matchId: string) =>
    fetchWithAuth<void>(`/api/matches/${matchId}`, { method: 'DELETE' }),
};

// Sessions API
export const sessionsApi = {
  getSessions: (status?: string) => {
    const params = status ? `?status_filter=${status}` : '';
    return fetchWithAuth<Session[]>(`/api/sessions/${params ? params : ''}`);
  },
  
  getPendingRequests: () => fetchWithAuth<Session[]>('/api/sessions/pending'),
  
  getSentRequests: () => fetchWithAuth<Session[]>('/api/sessions/sent'),
  
  getScheduledSessions: () => fetchWithAuth<Session[]>('/api/sessions/scheduled'),
  
  getHistory: () => fetchWithAuth<Session[]>('/api/sessions/history'),
  
  getCreditRates: () => fetchWithAuth<{ rates: Record<number, number> }>('/api/sessions/credit-rates'),
  
  createSession: (data: Omit<Session, 'id' | 'user_id' | 'status' | 'credits_amount' | 'rating' | 'feedback' | 'rated_by' | 'created_at' | 'updated_at'>) =>
    fetchWithAuth<Session>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  acceptSession: (sessionId: string) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}/accept`, { method: 'POST' }),
  
  rejectSession: (sessionId: string) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}/reject`, { method: 'POST' }),
  
  cancelSession: (sessionId: string) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}/cancel`, { method: 'POST' }),
  
  updateSession: (sessionId: string, data: Partial<Session>) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  completeSession: (sessionId: string) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}/complete`, { method: 'POST' }),
  
  rateSession: (sessionId: string, rating: number, feedback?: string) =>
    fetchWithAuth<Session>(`/api/sessions/${sessionId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    }),
  
  deleteSession: (sessionId: string) =>
    fetchWithAuth<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' }),
};

// Credits API
export const creditsApi = {
  getBalance: () => fetchWithAuth<{ user_id: string; credits: number }>('/api/credits/balance'),
  
  getHistory: (skip = 0, limit = 50) =>
    fetchWithAuth<CreditTransaction[]>(`/api/credits/history?skip=${skip}&limit=${limit}`),
  
  earnCredits: (data: { amount: number; transaction_type: string; description?: string; session_id?: string }) =>
    fetchWithAuth<CreditTransaction>('/api/credits/earn', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  spendCredits: (data: { amount: number; transaction_type: string; description?: string; session_id?: string }) =>
    fetchWithAuth<CreditTransaction>('/api/credits/spend', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Messaging Types
export interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  other_user: ConversationParticipant;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// Messages API
export const messagesApi = {
  getConversations: () => fetchWithAuth<Conversation[]>('/api/messages/conversations'),
  
  startConversation: (userId: string, initialMessage?: string) =>
    fetchWithAuth<Conversation>('/api/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, initial_message: initialMessage }),
    }),
  
  getConversation: (conversationId: string) =>
    fetchWithAuth<ConversationWithMessages>(`/api/messages/conversations/${conversationId}`),
  
  sendMessage: (conversationId: string, content: string) =>
    fetchWithAuth<Message>(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  
  getUnreadCount: () => fetchWithAuth<{ unread_count: number }>('/api/messages/unread-count'),
};
