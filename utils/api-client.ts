import { APIRequestContext, APIResponse } from '@playwright/test';

export interface User {
  id: string;
  username: string;
  createdAt: string;
  token?: string;
}

export interface WorkoutEntry {
  id: string;
  exerciseType: ExerciseType;
  sets: number;
  reps: number;
  weight: number;
  position: number;
}

export interface WorkoutSession {
  id: string;
  createdAt: string;
  exercises: WorkoutEntry[];
}

export type ExerciseType = 'DEADLIFT' | 'BACK_SQUAT' | 'BENCH_PRESS';

export interface WorkoutEntryRequest {
  exerciseType: ExerciseType;
  sets: number;
  reps: number;
  weight: number;
}

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  withToken(token: string): ApiClient {
    return new ApiClient(this.request, this.baseUrl, token);
  }

  private get authHeader(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // Auth
  async register(username: string, password: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/register`, {
      data: { username, password },
    });
  }

  async login(username: string, password: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { username, password },
    });
  }

  async logout(): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/logout`, {
      headers: this.authHeader,
    });
  }

  // Workout Sessions
  async getSessions(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/workout-sessions`, {
      headers: this.authHeader,
    });
  }

  async createSession(exercises: WorkoutEntryRequest[]): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/workout-sessions`, {
      data: { exercises },
      headers: this.authHeader,
    });
  }

  async getSession(id: string): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/workout-sessions/${id}`, {
      headers: this.authHeader,
    });
  }

  async deleteSession(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/api/workout-sessions/${id}`, {
      headers: this.authHeader,
    });
  }

  async health(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/health`);
  }
}
