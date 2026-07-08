"use client";

import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";

export { useAuth } from "./AuthProvider";
export { useThemeMode } from "./ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
    );
}
