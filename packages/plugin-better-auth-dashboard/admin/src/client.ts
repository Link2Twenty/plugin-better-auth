import type { dash } from "@better-auth/infra";
import { dashClient } from "@better-auth/infra/client";
import { createAuthClient, InferPlugin } from "better-auth/client";

const STORAGE_KEYS = {
  TOKEN: "jwtToken",
  USER: "userInfo",
};

/**
 * Retrieves the value of a specified cookie.
 *
 * @param name - The name of the cookie to retrieve.
 * @returns The decoded cookie value if found, otherwise null.
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

const getToken = (): string | null | undefined => {
  const fromLocalStorage = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (fromLocalStorage) {
    return JSON.parse(fromLocalStorage);
  }

  const fromCookie = getCookieValue(STORAGE_KEYS.TOKEN);
  return fromCookie ?? null;
};

/**
 * Returns a stable Better Auth client pointed at the admin proxy.
 * Auth is handled at the route level (admin route type); no token plumbing needed.
 *
 * InferPlugin<ReturnType<typeof dash>> exposes all server-side dash() endpoints
 * on the client type (e.g. client.dash.listUsers, client.dash.organization.members).
 */
export const client = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/better-auth",
  plugins: [dashClient(), InferPlugin<ReturnType<typeof dash>>()],
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  },
});
