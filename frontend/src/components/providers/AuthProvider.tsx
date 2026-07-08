"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/fetcher";
import type { User } from "@/types";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            const token = localStorage.getItem("access_token");
            if (token) {
                try {
                    const userData = await api.get("/auth/me");
                    setUser(userData);
                } catch (err) {
                    console.error("Failed to load user session", err);
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                }
            }
            setIsLoading(false);
        }

        loadUser();

        const handleAuthExpired = () => {
            setUser(null);
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        };
        window.addEventListener("auth_expired", handleAuthExpired);
        return () => window.removeEventListener("auth_expired", handleAuthExpired);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password }, { skipAuth: true });
            localStorage.setItem("access_token", res.access_token);
            localStorage.setItem("refresh_token", res.refresh_token);
            setUser(res.user);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const res = await api.post("/auth/register", { username, email, password }, { skipAuth: true });
            localStorage.setItem("access_token", res.access_token);
            localStorage.setItem("refresh_token", res.refresh_token);
            setUser(res.user);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        setIsLoading(true);
        try {
            const res = await api.post("/auth/google", { google_id_token: idToken }, { skipAuth: true });
            localStorage.setItem("access_token", res.access_token);
            localStorage.setItem("refresh_token", res.refresh_token);
            setUser(res.user);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                loginWithGoogle,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
