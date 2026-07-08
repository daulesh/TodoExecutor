"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/fetcher";
import { 
    Typography, 
    Box, 
    Card, 
    TextField, 
    Button, 
    MenuItem, 
    IconButton, 
    CircularProgress,
    Alert,
    Grid,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

interface Category {
    id: string;
    title: string;
    color_hex: string;
}

export function NewTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetDate, setTargetDate] = useState(() => {
        return searchParams.get("date") || new Date().toISOString().split("T")[0];
    });
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState("");
    const [categoryId, setCategoryId] = useState(() => {
        return searchParams.get("category_id") || "";
    });

    // Load categories
    useEffect(() => {
        async function fetchCats() {
            try {
                const data = await api.get("/categories");
                setCategories(data);
                
                // Set default category only if not passed in query
                if (!categoryId && data.length > 0) {
                    setCategoryId(data[0].id);
                }
            } catch (err) {
                console.error("Failed to load categories", err);
            } finally {
                setLoadingCats(false);
            }
        }
        fetchCats();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const body = {
                title,
                description: description || null,
                target_date: targetDate,
                start_time: startTime || null,
                end_time: endTime || null,
                estimated_duration_minutes: estimatedDuration ? parseInt(estimatedDuration) : null,
                category_id: categoryId || null,
            };

            await api.post("/tasks", body);
            router.push("/"); // Back to dashboard
        } catch (err: any) {
            setError(err.message || "Failed to create task. Check inputs.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3, maxWidth: "600px", mx: "auto", width: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton 
                    onClick={() => router.back()} 
                    sx={{ 
                        color: "#9ca3af",
                        border: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-1px", fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
                    Create Task
                </Typography>
            </Box>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {loadingCats ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress color="primary" />
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <TextField
                                label="Task Title"
                                required
                                fullWidth
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Finish project slides"
                            />

                            <TextField
                                label="Description"
                                multiline
                                rows={3}
                                fullWidth
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Details about this task..."
                            />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Target Date"
                                        type="date"
                                        required
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Category"
                                        required
                                        fullWidth
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                    >
                                        {categories.map((option) => (
                                            <MenuItem key={option.id} value={option.id}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: option.color_hex }} />
                                                    {option.title}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Start Time"
                                        type="time"
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="End Time"
                                        type="time"
                                        fullWidth
                                        slotProps={{ inputLabel: { shrink: true } }}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Est. Duration (mins)"
                                        type="number"
                                        fullWidth
                                        value={estimatedDuration}
                                        onChange={(e) => setEstimatedDuration(e.target.value)}
                                        placeholder="e.g. 60"
                                    />
                                </Grid>
                            </Grid>

                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary" 
                                size="large" 
                                fullWidth
                                disabled={submitting}
                                sx={{ height: 50, mt: 1 }}
                            >
                                {submitting ? "Creating Task..." : "Create Task"}
                            </Button>
                        </form>
                    )}
                </Card>
            </motion.div>
        </Box>
    );
}
