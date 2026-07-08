"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button } from "@mui/material";
import { Google } from "@mui/icons-material";
import { BackButton } from "@/components/ui";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { ROUTES } from "@/constants/routes";

interface AuthPageShellProps {
    children: React.ReactNode;
}

export function AuthPageShell({ children }: AuthPageShellProps) {
    const { resolvedMode } = useThemeMode();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: !mounted
                    ? "#05040a"
                    : resolvedMode === "dark"
                      ? "radial-gradient(circle at 50% 50%, rgba(90, 47, 184, 0.1) 0%, rgba(0, 0, 0, 0) 50%), #05040a"
                      : "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.05) 0%, rgba(0, 0, 0, 0) 50%), #F9FAFB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <BackButton
                href={ROUTES.welcome}
                sx={{ position: "absolute", top: { xs: 12, sm: 24 }, left: { xs: 12, sm: 24 } }}
            />
            {children}
        </Box>
    );
}

interface GoogleSignInButtonProps {
    loading: boolean;
    onMockLogin: () => void;
    onError: (message: string) => void;
    onSuccess: () => void;
    onStart?: () => void;
    loginWithGoogle: (token: string) => Promise<void>;
}

export function GoogleSignInButton({ loading, onMockLogin, onError, onSuccess, onStart, loginWithGoogle }: GoogleSignInButtonProps) {
    const router = useRouter();

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const renderGoogleButton = () => {
            if (typeof window !== "undefined" && (window as any).google) {
                (window as any).googleCallback = async (response: any) => {
                    onStart?.();
                    try {
                        await loginWithGoogle(response.credential);
                        onSuccess();
                        router.push(ROUTES.home);
                    } catch (err: any) {
                        onError(err.message || "Google authentication failed.");
                    }
                };

                if (!(window as any).gsiInitialized) {
                    (window as any).google.accounts.id.initialize({
                        client_id: clientId,
                        callback: (response: any) => {
                            if ((window as any).googleCallback) {
                                (window as any).googleCallback(response);
                            }
                        },
                    });
                    (window as any).gsiInitialized = true;
                }

                const container = document.getElementById("google-sign-in-container");
                if (!container) return;

                const width = Math.min(Math.max(container.clientWidth || 320, 40), 400);
                (window as any).google.accounts.id.renderButton(container, {
                    theme: "outline",
                    size: "large",
                    width,
                    type: "standard",
                });
            }
        };

        const interval = setInterval(() => {
            if ((window as any).google) {
                renderGoogleButton();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [loginWithGoogle, onError, onSuccess, router]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        return (
            <Button
                variant="outlined"
                fullWidth
                startIcon={<Google sx={{ color: "#4285F4" }} />}
                onClick={onMockLogin}
                disabled={loading}
                sx={{ height: 48, borderColor: "divider", color: "text.primary" }}
            >
                Continue with Google
            </Button>
        );
    }

    return (
        <Box sx={{ position: "relative", width: "100%", height: 48 }}>
            <Button
                variant="outlined"
                fullWidth
                disabled={loading}
                tabIndex={-1}
                startIcon={<Google sx={{ color: "#4285F4" }} />}
                sx={{ height: 48, borderColor: "divider", color: "text.primary", pointerEvents: "none" }}
            >
                Continue with Google
            </Button>
            <Box
                id="google-sign-in-container"
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
        </Box>
    );
}
