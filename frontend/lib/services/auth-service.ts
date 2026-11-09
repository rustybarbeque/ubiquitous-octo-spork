import { apiFetch } from "@/lib/api-client";
import { AuthResponse, User } from "@/lib/types";

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Signs in. Rejects with an ApiError (400) on a wrong email or password. */
export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Creates a customer account and signs it in. 409 if the email is taken. */
export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

/** The account the token belongs to. 401 if the token is no longer valid. */
export function getCurrentUser(token: string): Promise<User> {
  return apiFetch<User>("/auth/me", { token });
}
