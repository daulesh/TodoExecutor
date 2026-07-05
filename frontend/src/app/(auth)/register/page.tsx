"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth, useThemeMode } from "@/components/providers/Providers";
import { Container, Card, TextField, Button, Typography, Box, Alert, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff, Google, ArrowBack } from "@mui/icons-material";

export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const { resolvedMode } = useThemeMode();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const renderGoogleButton = () => {
            if (typeof window !== "undefined" && (window as any).google) {
                // Register local state callback in a global dispatcher to avoid memory leaks
                (window as any).googleCallback = async (response: any) => {
                    setLoading(true);
                    setError(null);
                    try {
                        await loginWithGoogle(response.credential);
                        router.push("/");
                    } catch (err: any) {
                        setError(err.message || "Google authentication failed.");
                    } finally {
                        setLoading(false);
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
                (window as any).google.accounts.id.renderButton(
                    container,
                    { theme: "outline", size: "large", width, type: "standard" }
                );
            }
        };

        const interval = setInterval(() => {
            if ((window as any).google) {
                renderGoogleButton();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [loginWithGoogle, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await register(username, email, password);
            router.push("/"); // Redirect to dashboard
        } catch (err: any) {
            setError(err.message || "Failed to create an account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMockGoogleLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle("mock_development_token");
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Google authentication failed.");
        } finally {
            setLoading(false);
        }
    };

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
            <IconButton 
                component={Link}
                href="/"
                sx={{ 
                    position: "absolute", 
                    top: { xs: 12, sm: 24 }, 
                    left: { xs: 12, sm: 24 }, 
                    color: "#9ca3af",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                }}
            >
                <ArrowBack />
            </IconButton>

            <Container maxWidth="xs" sx={{ pt: { xs: 6, sm: 0 } }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", gap: 3 }}>
                        <Box sx={{ textAlign: "center", mb: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.5px" }}>
                                Get Started
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                                Create a premium account to organize your flow
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 3, backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <TextField
                                label="Username"
                                type="text"
                                fullWidth
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <TextField
                                label="Email Address"
                                type="email"
                                fullWidth
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <TextField
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                fullWidth
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                            />

                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary" 
                                size="large" 
                                fullWidth
                                disabled={loading}
                                sx={{ height: 48 }}
                            >
                                {loading ? "Creating Account..." : "Sign Up"}
                            </Button>
                        </form>

                        <Box sx={{ display: "flex", alignItems: "center", my: 1 }}>
                            <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: "divider" }} />
                            <Typography variant="caption" sx={{ px: 2, color: "text.secondary" }}>
                                OR
                            </Typography>
                            <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: "divider" }} />
                        </Box>

                        {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Google sx={{ color: "#4285F4" }} />}
                                onClick={handleMockGoogleLogin}
                                disabled={loading}
                                sx={{
                                    height: 48,
                                    borderColor: "divider",
                                    color: "text.primary",
                                }}
                            >
                                Continue with Google
                            </Button>
                        ) : (
                            <Box sx={{ position: "relative", width: "100%", height: 48 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled={loading}
                                    tabIndex={-1}
                                    startIcon={<Google sx={{ color: "#4285F4" }} />}
                                    sx={{
                                        height: 48,
                                        borderColor: "divider",
                                        color: "text.primary",
                                        pointerEvents: "none",
                                    }}
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
                        )}

                        <Box sx={{ textAlign: "center", mt: 1 }}>
                            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                                Already have an account?{" "}
                                <Link href="/login" style={{ color: "#8B5CF6", textDecoration: "none", fontWeight: 600 }}>
                                    Login
                                </Link>
                            </Typography>
                        </Box>
                    </Card>
                </motion.div>
            </Container>
        </Box>
    );
}
