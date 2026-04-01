import api from "./api";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export async function login(creds: LoginCredentials): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", creds);
  if (typeof window !== "undefined") {
    localStorage.setItem("visualpc_token", data.access_token);
    localStorage.setItem("visualpc_role", data.role || "user");
  }
  return data;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("visualpc_token");
    localStorage.removeItem("visualpc_role");
    window.location.href = "/login";
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("visualpc_token");
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUserRole(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("visualpc_role") || "user";
  }
  return "user";
}
