"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const getCustomTheme = (mode: "light" | "dark") => {
    const isDark = mode === "dark";
    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? "#8B5CF6" : "#7C3AED",
                light: isDark ? "#A78BFA" : "#A78BFA",
                dark: isDark ? "#6D28D9" : "#5B21B6",
            },
            secondary: {
                main: isDark ? "#2ECB71" : "#10B981",
                light: isDark ? "#A7F3D0" : "#A7F3D0",
                dark: isDark ? "#047857" : "#065F46",
            },
            error: {
                main: "#FF6B6B",
            },
            background: {
                default: isDark ? "#0A0915" : "#F9FAFB",
                paper: isDark ? "#121124" : "#FFFFFF",
            },
            text: {
                primary: isDark ? "#F3F4F6" : "#111827",
                secondary: isDark ? "#9CA3AF" : "#4B5563",
            },
            divider: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.08)",
        },
        shape: {
            borderRadius: 16,
        },
        typography: {
            fontFamily: "var(--font-sans), Arial, sans-serif",
            h1: { fontWeight: 800 },
            h2: { fontWeight: 700 },
            h3: { fontWeight: 700 },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        padding: "8px 20px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: isDark
                                ? "0 4px 12px rgba(139, 92, 246, 0.35)"
                                : "0 4px 12px rgba(124, 58, 237, 0.15)",
                        },
                        "&:active": {
                            transform: "translateY(0)",
                        },
                    },
                },
                variants: [
                    {
                        props: { variant: "contained", color: "primary" },
                        style: {
                            background: isDark
                                ? "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                                : "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                        },
                    },
                ],
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        border: isDark
                            ? "1px solid rgba(139, 92, 246, 0.1)"
                            : "1px solid rgba(124, 58, 237, 0.08)",
                        backgroundImage: isDark
                            ? "linear-gradient(to bottom, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0))"
                            : "none",
                        boxShadow: isDark
                            ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                            : "0 8px 32px 0 rgba(124, 58, 237, 0.04)",
                        backdropFilter: "blur(4px)",
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 12,
                            transition: "all 0.2s ease-in-out",
                            "& fieldset": {
                                borderColor: isDark
                                    ? "rgba(139, 92, 246, 0.2)"
                                    : "rgba(124, 58, 237, 0.15)",
                            },
                            "&:hover fieldset": {
                                borderColor: isDark
                                    ? "rgba(139, 92, 246, 0.4)"
                                    : "rgba(124, 58, 237, 0.3)",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: isDark ? "#8B5CF6" : "#7C3AED",
                                boxShadow: isDark
                                    ? "0 0 0 2px rgba(139, 92, 246, 0.2)"
                                    : "0 0 0 2px rgba(124, 58, 237, 0.1)",
                            },
                        },
                    },
                },
            },
        },
    });
};

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    resolvedMode: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useThemeMode must be used within a ThemeProvider");
    }
    return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
    const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedMode = localStorage.getItem("theme_mode") as ThemeMode | null;
            if (savedMode) {
                setThemeModeState(savedMode);
            }
        }
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("theme_mode", mode);
        }
    };

    useEffect(() => {
        const updateResolvedTheme = () => {
            let actualMode: "light" | "dark" = "dark";
            if (themeMode === "system") {
                const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                actualMode = systemPrefersDark ? "dark" : "light";
            } else {
                actualMode = themeMode === "dark" ? "dark" : "light";
            }

            setResolvedMode(actualMode);

            if (typeof document !== "undefined") {
                document.documentElement.style.colorScheme = actualMode;
                if (actualMode === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
        };

        updateResolvedTheme();

        if (themeMode === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.addEventListener("change", updateResolvedTheme);
            return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
        }
    }, [themeMode]);

    const activeTheme = getCustomTheme(resolvedMode);

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedMode }}>
            <MuiThemeProvider theme={activeTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}
