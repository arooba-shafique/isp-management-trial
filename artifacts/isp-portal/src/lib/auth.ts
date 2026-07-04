import { setAuthTokenGetter } from "@workspace/api-client-react";

export const TOKEN_KEY = "isp_token";

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

setAuthTokenGetter(() => getAuthToken());
