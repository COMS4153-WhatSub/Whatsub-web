"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  email: string;
  name: string;
  picture: string;
  token: string; // JWT from your backend
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (googleIdToken: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("whatsub_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("whatsub_user");
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (googleIdToken: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: googleIdToken }),
        }
      );

      if (!res.ok) {
        throw new Error("Authentication failed");
      }

      const data = await res.json();

      // Adjust these fields based on your backend response
      const userData: User = {
        email: data.email || data.user?.email,
        name: data.name || data.user?.name,
        picture: data.picture || data.user?.picture,
        token: data.token || data.access_token,
      };

      setUser(userData);
      localStorage.setItem("whatsub_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("whatsub_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
