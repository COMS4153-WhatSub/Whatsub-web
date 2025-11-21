"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("whatsub_token");
    const storedUserId = localStorage.getItem("whatsub_user_id");
    const storedUser = localStorage.getItem("whatsub_user");
    
    if (storedToken && storedUserId && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUserId(storedUserId);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // Clear invalid data
        localStorage.removeItem("whatsub_token");
        localStorage.removeItem("whatsub_user_id");
        localStorage.removeItem("whatsub_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUserId(newUser.id);
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("whatsub_token", newToken);
    localStorage.setItem("whatsub_user_id", newUser.id);
    localStorage.setItem("whatsub_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("whatsub_token");
    localStorage.removeItem("whatsub_user_id");
    localStorage.removeItem("whatsub_user");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ token, userId, user, isLoading, login, logout, isAuthenticated }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}