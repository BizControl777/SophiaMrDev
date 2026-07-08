export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  plan?: 'Free' | 'Pro' | 'Elite';
  balance: number;
  reputation: number;
}

// Additional shared types can be added here
export interface APIResponse<T> {
  data?: T;
  error?: string;
}
