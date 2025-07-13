import { ApiResponse, Exercise, Session, CreateSessionRequest, SessionExercise } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export const exerciseApi = {
  getAll: (): Promise<ApiResponse<Exercise[]>> => 
    apiRequest<Exercise[]>('/exercises'),
  
  getById: (id: number): Promise<ApiResponse<Exercise>> =>
    apiRequest<Exercise>(`/exercises/${id}`),
  
  create: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Exercise>> =>
    apiRequest<Exercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    }),
  
  update: (id: number, exercise: Partial<Exercise>): Promise<ApiResponse<Exercise>> =>
    apiRequest<Exercise>(`/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exercise),
    }),
  
  delete: (id: number): Promise<ApiResponse<null>> =>
    apiRequest<null>(`/exercises/${id}`, {
      method: 'DELETE',
    }),
};

export const sessionApi = {
  getAll: (): Promise<ApiResponse<Session[]>> =>
    apiRequest<Session[]>('/sessions'),
  
  getById: (id: string): Promise<ApiResponse<Session>> =>
    apiRequest<Session>(`/sessions/${id}`),
  
  create: (session: CreateSessionRequest): Promise<ApiResponse<Session>> =>
    apiRequest<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    }),
  
  update: (id: string, session: Partial<Session>): Promise<ApiResponse<Session>> =>
    apiRequest<Session>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    }),
  
  delete: (id: string): Promise<ApiResponse<null>> =>
    apiRequest<null>(`/sessions/${id}`, {
      method: 'DELETE',
    }),
  
  updateExercise: (sessionId: string, exerciseId: number, data: {
    actualSets?: number;
    actualReps?: number[];
    weight?: number[];
  }): Promise<ApiResponse<SessionExercise>> =>
    apiRequest<SessionExercise>(`/sessions/${sessionId}/exercises`, {
      method: 'PUT',
      body: JSON.stringify({ exerciseId, ...data }),
    }),

  terminate: (sessionId: string, data: {
    actualDuration: number;
    completedExercises: {
      exerciseId: number;
      actualSets: number;
      actualReps: number[];
      weight: number[];
    }[];
  }): Promise<ApiResponse<Session>> =>
    apiRequest<Session>(`/sessions/${sessionId}/terminate`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const templateApi = {
  getAll: (): Promise<ApiResponse<Session[]>> =>
    apiRequest<Session[]>('/sessions/templates'),
};