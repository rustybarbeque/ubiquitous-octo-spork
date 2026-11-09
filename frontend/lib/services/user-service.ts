import { apiFetch } from "@/lib/api-client";
import { User } from "@/lib/types";

export interface UpdateProfileInput {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Updates the signed-in user's own name and email (PUT /users/me).
 * 409 if another account already uses the email. Cannot change a role.
 */
export function updateMyProfile(token: string, input: UpdateProfileInput): Promise<User> {
  return apiFetch<User>("/users/me", { method: "PUT", body: input, token });
}
