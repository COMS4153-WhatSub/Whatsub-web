"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login page if already authenticated (will redirect via useEffect)
  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Sign in to Whatsub
        </h2>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                    setError(""); // Clear any previous errors
                    // Send ID Token to Backend to exchange for Session Token / Verify
                    const res = await fetch(`${API_BASE_URL}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_token: credentialResponse.credential })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        // Backend returns { token: { access_token: ... }, user: { id, name, email, picture? } }
                        const token = data.token?.access_token;
                        const userData = data.user;
                        
                        if (token && userData?.id) {
                            // Extract role from JWT token
                            const { getRoleFromToken } = await import("@/lib/api");
                            const role = getRoleFromToken(token);
                            
                            // Create user object with required fields
                            const user = {
                                id: userData.id,
                                name: userData.full_name || userData.name || userData.email || "User",
                                email: userData.email || "",
                                picture: userData.picture || userData.avatar_url || undefined,
                                role: role,
                            };
                            login(token, user);
                            router.push("/");
                        } else {
                            setError("Invalid response from server: Missing token or user ID");
                            console.error("Login response structure mismatch:", data);
                        }
                    } else {
                        const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
                        setError(errorData.detail || "Login failed via backend validation");
                    }
                } catch (e) {
                    setError("Network error during login");
                    console.error(e);
                }
              }
            }}
            onError={() => {
              setError("Google Login Failed. Please try again.");
            }}
          />
        </div>
      </div>
    </div>
  );
}
