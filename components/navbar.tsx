"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LayoutDashboard, Calendar, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;


// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: { theme: string; size: string; width?: number }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}


export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, signIn, signOut } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar/", label: "Calendar", icon: Calendar },
  ];

  useEffect(() => {
    if (isLoading || user) return;

    // Wait for Google script to load
    const initializeGoogle = () => {
      if (!window.google) {
        setTimeout(initializeGoogle, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await signIn(response.credential);
          } catch (error) {
            console.error("Sign in failed:", error);
          }
        },
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
        });
      }
    };

    initializeGoogle();
  }, [isLoading, user, signIn]);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <div>
            <h1 className="text-2xl font-bold">WhatSub</h1>
            <p className="text-sm text-muted-foreground">
              Manage your subscriptions
            </p>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right: Auth Section */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              // Loading state
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              // Logged in state
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-6 w-6" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar>
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Logged out state - Google Sign In button
              <div ref={googleButtonRef} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
