"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Sign in to Whatsub
        </h2>
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mt-8 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
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
                            // Create user object with required fields
                            const user = {
                                id: userData.id,
                                name: userData.name || userData.email || "User",
                                email: userData.email || "",
                                picture: userData.picture || userData.avatar_url || undefined,
                            };
                            login(token, user);
                            router.push("/");
                        } else {
                            setError("Invalid response from server: Missing token or user ID");
                            console.error("Login response structure mismatch:", data);
                        }
                    } else {
                        setError("Login failed via backend validation");
                    }
                } catch (e) {
                    setError("Network error during login");
                    console.error(e);
                }
              }
            }}
            onError={() => setError("Google Login Failed")}
          />
        </div>
      </div>
    </div>
  );
}
