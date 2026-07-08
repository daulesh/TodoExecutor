"use client";

import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useThemeMode } from "@/components/providers/ThemeProvider";

interface BriefingCardProps {
    loading: boolean;
    briefing: string | null;
}

export function BriefingCard({ loading, briefing }: BriefingCardProps) {
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";

    if (loading) {
        return (
            <Card
                sx={{
                    p: 2.5,
                    background: isDark
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.01) 0%, rgba(99, 102, 241, 0.01) 100%)",
                    border: "1px dashed",
                    borderColor: isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.05)",
                    borderRadius: 3.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <CircularProgress size={20} sx={{ color: "primary.main" }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", mb: 0.2, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                        AI Daily Briefing
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", fontSize: "0.85rem" }}>
                        Consulting your productivity coach...
                    </Typography>
                </Box>
            </Card>
        );
    }

    if (!briefing) return null;

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card
                sx={{
                    p: 2.5,
                    background: isDark
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.1)",
                    borderRadius: 3.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 10px rgba(139, 92, 246, 0.25)",
                    }}
                >
                    <AutoAwesomeIcon sx={{ color: "white", fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main", mb: 0.2, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                        AI Daily Briefing
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: "0.875rem", sm: "0.95rem" }, lineHeight: 1.5 }}>
                        {briefing}
                    </Typography>
                </Box>
            </Card>
        </motion.div>
    );
}
