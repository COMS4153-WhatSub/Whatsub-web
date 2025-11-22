"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { isTokenExpired, getTimeUntilExpiration } from "./jwt-utils";
import { getRoleFromToken } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: "user" | "admin";
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// Token expiration check interval (check every 5 minutes)
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("whatsub_token");
    localStorage.removeItem("whatsub_user_id");
    localStorage.removeItem("whatsub_user");
    
    // Clear expiration timers
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
      expirationTimerRef.current = null;
    }
    if (periodicCheckRef.current) {
      clearInterval(periodicCheckRef.current);
      periodicCheckRef.current = null;
    }
    
    // Redirect to login page using window.location for reliability
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const checkTokenExpiration = (tokenToCheck: string) => {
    if (isTokenExpired(tokenToCheck)) {
      console.warn("Token expired, logging out...");
      logout();
      return false;
    }
    return true;
  };

  const scheduleExpirationCheck = (tokenToCheck: string) => {
    // Clear existing timers
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
      expirationTimerRef.current = null;
    }
    if (periodicCheckRef.current) {
      clearInterval(periodicCheckRef.current);
      periodicCheckRef.current = null;
    }

    const timeUntilExpiration = getTimeUntilExpiration(tokenToCheck);
    
    if (timeUntilExpiration === null) {
      // Token is already expired or invalid
      logout();
      return;
    }

    // Schedule check slightly before expiration (1 minute before)
    const checkTime = Math.max(timeUntilExpiration - 60 * 1000, 0);
    
    expirationTimerRef.current = setTimeout(() => {
      checkTokenExpiration(tokenToCheck);
    }, checkTime);

    // Also set up periodic checks as a fallback (every 5 minutes)
    periodicCheckRef.current = setInterval(() => {
      const currentToken = localStorage.getItem("whatsub_token");
      if (currentToken && isTokenExpired(currentToken)) {
        logout();
      }
    }, TOKEN_CHECK_INTERVAL);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("whatsub_token");
    const storedUserId = localStorage.getItem("whatsub_user_id");
    const storedUser = localStorage.getItem("whatsub_user");
    
    if (storedToken && storedUserId && storedUser) {
      try {
        // Check if token is expired before restoring
        if (isTokenExpired(storedToken)) {
          console.warn("Stored token is expired, clearing auth state");
          localStorage.removeItem("whatsub_token");
          localStorage.removeItem("whatsub_user_id");
          localStorage.removeItem("whatsub_user");
          setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        
        // Extract role from token (token is the source of truth)
        const role = getRoleFromToken(storedToken);
        const userWithRole = {
          ...parsedUser,
          role: role,
        };
        
      setToken(storedToken);
      setUserId(storedUserId);
        setUser(userWithRole);
      setIsAuthenticated(true);
        
        // Update localStorage with role
        localStorage.setItem("whatsub_user", JSON.stringify(userWithRole));
        
        // Schedule expiration check
        scheduleExpirationCheck(storedToken);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // Clear invalid data
        localStorage.removeItem("whatsub_token");
        localStorage.removeItem("whatsub_user_id");
        localStorage.removeItem("whatsub_user");
      }
    }
    setIsLoading(false);

    // Cleanup on unmount
    return () => {
      if (expirationTimerRef.current) {
        clearTimeout(expirationTimerRef.current);
      }
      if (periodicCheckRef.current) {
        clearInterval(periodicCheckRef.current);
      }
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    // Check if token is already expired (shouldn't happen, but safety check)
    if (isTokenExpired(newToken)) {
      console.error("Attempted to login with expired token");
      return;
    }

    setToken(newToken);
    setUserId(newUser.id);
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("whatsub_token", newToken);
    localStorage.setItem("whatsub_user_id", newUser.id);
    localStorage.setItem("whatsub_user", JSON.stringify(newUser));
    
    // Schedule expiration check for new token
    scheduleExpirationCheck(newToken);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ token, userId, user, isLoading, login, logout, isAuthenticated, isAdmin }}>
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