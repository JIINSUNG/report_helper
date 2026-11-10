export type Role = "admin" | "staff" | "guest";

export interface AuthClaims {
  role: Role;
  store?: string;
  /** 할일 목록 동기화용 개인 식별자. 게스트는 없음(동기화 안 됨). */
  todoKey?: string;
}

export interface UserProfile {
  name: string;
  role: Role;
  store?: string;
  updatedAt: string;
}
