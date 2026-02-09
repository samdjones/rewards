export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  profile_image: string | null;
  created_at: string;
}

/** User without sensitive fields - safe for API responses */
export type SafeUser = Omit<User, 'password_hash'>;
