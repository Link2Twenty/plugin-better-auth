import type { dash } from "@better-auth/infra";
import { dashClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/client";

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

const dashServerInference = () => ({
  id: "dash-server-inference" as const,
  $InferServerPlugin: {} as ReturnType<typeof dash>,
});

/**
 * Returns a stable Better Auth client pointed at the admin proxy.
 * Auth is handled at the route level (admin route type); no token plumbing needed.
 */
export const client = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/better-auth",
  plugins: [dashClient(), dashServerInference()],
  fetchOptions: {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  },
});
