"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Container, Card, TextField, Button, Typography, Box, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ErrorAlert } from "@/components/ui";
import { AuthPageShell, GoogleSignInButton } from "@/features/auth/components/AuthPageShell";
import { ROUTES } from "@/constants/routes";

export function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            router.push(ROUTES.home);
        } catch (err: any) {
            setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleMockGoogleLogin = async () => {
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle("mock_development_token");
            router.push(ROUTES.home);
        } catch (err: any) {
            setError(err.message || "Google authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthPageShell>
            <Container maxWidth="xs" sx={{ pt: { xs: 6, sm: 0 } }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card sx={{ p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", gap: 3 }}>
                        <Box sx={{ textAlign: "center", mb: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.5px" }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                                Log in to manage and execute your tasks
                            </Typography>
                        </Box>

                        {error && <ErrorAlert>{error}</ErrorAlert>}

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <TextField label="Email Address" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} />
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
                                    },
                                }}
                            />
                            <Button type="submit" variant="contained" color="primary" size="large" fullWidth disabled={loading} sx={{ height: 48 }}>
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </form>

                        <Box sx={{ display: "flex", alignItems: "center", my: 1 }}>
                            <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: "divider" }} />
                            <Typography variant="caption" sx={{ px: 2, color: "text.secondary" }}>
                                OR
                            </Typography>
                            <Box sx={{ flexGrow: 1, height: "1px", backgroundColor: "divider" }} />
                        </Box>

                        <GoogleSignInButton
                            loading={loading}
                            loginWithGoogle={loginWithGoogle}
                            onMockLogin={handleMockGoogleLogin}
                            onError={setError}
                            onStart={() => setLoading(true)}
                            onSuccess={() => setLoading(false)}
                        />

                        <Box sx={{ textAlign: "center", mt: 1 }}>
                            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                                Don&apos;t have an account?{" "}
                                <Link href={ROUTES.register} style={{ color: "#8B5CF6", textDecoration: "none", fontWeight: 600 }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </Card>
                </motion.div>
            </Container>
        </AuthPageShell>
    );
}
