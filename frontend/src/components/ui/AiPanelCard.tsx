"use client";

import { Box, Card, Typography } from "@mui/material";
import { useThemeMode } from "@/components/providers/ThemeProvider";

interface AiPanelCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function AiPanelCard({ icon, title, description, children }: AiPanelCardProps) {
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";

    return (
        <Card
            sx={{
                p: { xs: 2.5, sm: 4 },
                background: isDark
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)"
                    : "linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)",
                border: "1px solid",
                borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.1)",
                mb: 1,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        backgroundColor: "rgba(139, 92, 246, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {description}
                    </Typography>
                </Box>
            </Box>
            {children}
        </Card>
    );
}
