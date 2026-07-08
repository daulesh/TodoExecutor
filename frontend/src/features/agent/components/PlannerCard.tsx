"use client";

import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { AiPanelCard, ErrorAlert } from "@/components/ui";

interface PlannerCardProps {
    query: string;
    response: string | null;
    loading: boolean;
    error: string | null;
    onQueryChange: (value: string) => void;
    onGenerate: () => void;
}

export function PlannerCard({ query, response, loading, error, onQueryChange, onGenerate }: PlannerCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <AiPanelCard
                icon={<AutoAwesomeIcon sx={{ color: "#8B5CF6" }} />}
                title="AI Goal & Task Planner"
                description="Describe a project or milestone, and the ADK 2.0 Agent will auto-populate categories and tasks."
            >
                {error && <ErrorAlert sx={{ mb: 3 }}>{error}</ErrorAlert>}
                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., Plan my Kaggle submission timeline over the next 3 weeks..."
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        disabled={loading}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                    <Button
                        variant="contained"
                        onClick={onGenerate}
                        disabled={loading || !query.trim()}
                        sx={{
                            px: 4,
                            height: 56,
                            borderRadius: 3,
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Plan"}
                    </Button>
                </Box>
                {response && (
                    <Box
                        sx={{
                            mt: 3,
                            p: 2.5,
                            borderRadius: 3,
                            backgroundColor: "rgba(139, 92, 246, 0.02)",
                            border: "1px solid rgba(139, 92, 246, 0.15)",
                            borderLeft: "5px solid #8B5CF6",
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                            <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                            Planner Output:
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                            {response}
                        </Typography>
                    </Box>
                )}
            </AiPanelCard>
        </motion.div>
    );
}
