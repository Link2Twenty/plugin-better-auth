import type { dash } from "@better-auth/infra";
import { dashClient } from "@better-auth/infra/client";
import { createAuthClient, InferPlugin } from "better-auth/client";

const STORAGE_KEYS = {
  TOKEN: "jwtToken",
  USER: "userInfo",
};

/**
 * Retrieves the value of a specified cookie.
 */
export const getCookieValue = (name: string): string | null => {
  let result = null;
  const cookieArray = document.cookie.split(";");
  cookieArray.forEach((cookie) => {
    const [key, value] = cookie.split("=").map((item) => item.trim());
    if (key === name) {
      result = decodeURIComponent(value);
    }
  });
  return result;
};

export const getToken = (): string | null | undefined => {
  const fromLocalStorage = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (fromLocalStorage) {
    return JSON.parse(fromLocalStorage) as string;
  }

  const fromCookie = getCookieValue(STORAGE_KEYS.TOKEN);
  return fromCookie ?? null;
};

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Better Auth client pointed at the admin proxy (/better-auth).
 *
 * Auth is handled at the route level (Strapi JWT in Authorization header).
 * InferPlugin<ReturnType<typeof dash>> exposes all server-side dash() endpoints
 * with full TypeScript type inference.
 *
 * For endpoints that need JWT context (userId, organizationId, etc.), use the
 * withContext() helper from utils/dashContext.ts as the second argument.
 */
export const client = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/better-auth",
  plugins: [dashClient(), InferPlugin<ReturnType<typeof dash>>()],
  fetchOptions: {
    headers: getAuthHeaders(),
  },
});
