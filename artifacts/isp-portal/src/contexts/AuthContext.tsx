import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { setAuthToken, getAuthToken } from "@/lib/auth";

interface AuthUser {
  id: number;
  phone: string;
  name: string;
  role: "admin" | "customer";
  status: string;
  address?: string | null;
  zone?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => !!getAuthToken());

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: hasToken,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  function login(token: string) {
    setAuthToken(token);
    setHasToken(true);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  }

  function logout() {
    setAuthToken(null);
    setHasToken(false);
    queryClient.clear();
  }

  useEffect(() => {
    if (!hasToken) {
      setAuthToken(null);
    }
  }, [hasToken]);

  return (
    <AuthContext.Provider
      value={{
        user: user as AuthUser | null ?? null,
        isLoading: hasToken ? isLoading : false,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
