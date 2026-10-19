export type Role = "admin" | "staff" | "guest";

export interface AuthClaims {
  role: Role;
  store?: string;
}

export interface UserProfile {
  name: string;
  role: Role;
  store?: string;
  updatedAt: string;
}
