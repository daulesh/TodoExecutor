"use client";

import { Box, Button, Card, CircularProgress, TextField, Typography } from "@mui/material";
import { AutoAwesome as CoachIcon, Psychology as PsychologyIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { ErrorAlert } from "@/components/ui";

interface InsightsCoachProps {
    query: string;
    response: string | null;
    loading: boolean;
    error: string | null;
    onQueryChange: (value: string) => void;
    onConsult: () => void;
}

export function InsightsCoach({ query, response, loading, error, onQueryChange, onConsult }: InsightsCoachProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ p: { xs: 2.5, sm: 4 }, mt: 4, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, backgroundColor: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
                    <PsychologyIcon sx={{ fontSize: 30, color: "#8B5CF6" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    AI Productivity Coach
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, mb: 3 }}>
                    Ask the ADK 2.0 Agentic AI coach to analyze your current execution metrics and suggest optimization plans.
                </Typography>
                {error && <ErrorAlert sx={{ mb: 3 }}>{error}</ErrorAlert>}
                <TextField label="Ask Coach" multiline rows={3} fullWidth value={query} onChange={(e) => onQueryChange(e.target.value)} sx={{ mb: 3 }} />
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CoachIcon />}
                    onClick={onConsult}
                    disabled={loading}
                    sx={{ height: 52, background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}
                >
                    {loading ? "Analyzing Data..." : "Consult AI Coach"}
                </Button>
                {response && (
                    <Box sx={{ mt: 4, p: 2.5, borderRadius: 3, backgroundColor: "rgba(139, 92, 246, 0.03)", border: "1px solid rgba(139, 92, 246, 0.15)", borderLeft: "5px solid #8B5CF6" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                            <CoachIcon sx={{ fontSize: 18 }} />
                            Coach Insights:
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                            {response}
                        </Typography>
                    </Box>
                )}
            </Card>
        </motion.div>
    );
}
