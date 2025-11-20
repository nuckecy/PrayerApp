const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      data.error || 'An error occurred',
      response.status,
      data.details
    );
  }

  return data;
}

export const api = {
  // Auth
  register: (data: {
    email: string;
    password: string;
    name: string;
    timezone: string;
  }) => fetcher('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) =>
    fetcher('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => fetcher('/api/auth/me'),

  // Goals
  getGoals: () => fetcher('/api/goals'),

  getGoal: (id: string) => fetcher(`/api/goals/${id}`),

  getGoalDay: (goalId: string, dayIndex: number) =>
    fetcher(`/api/goals/${goalId}/days/${dayIndex}`),

  // Enrollments
  enroll: (data: { goalId: string; groupId?: string }) =>
    fetcher('/api/enrollments/enroll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyGoals: () => fetcher('/api/enrollments/my-goals'),

  completeDay: (enrollmentId: string, data: { dayIndex: number; completedData?: any }) =>
    fetcher(`/api/enrollments/${enrollmentId}/complete-day`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProgress: (enrollmentId: string) =>
    fetcher(`/api/enrollments/${enrollmentId}/progress`),
};
