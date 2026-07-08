import { User, UserRole } from "@sophia/shared";
export type { User, UserRole };

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
