"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/fetcher";
import { suggestSubtasks, getApiErrorMessage, isQuotaExceededError } from "@/features/agent/api/agent-api";
import { useThemeMode } from "@/components/providers/ThemeProvider";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import { 
    ArrowBack, 
    Delete as DeleteIcon, 
    History as HistoryIcon,
    AutoAwesome as AutoAwesomeIcon
} from "@mui/icons-material";

interface Category {
    id: string;
    title: string;
    color_hex: string;
}

interface ChangeLog {
    id: string;
    reason: string;
    original_target_date: string;
    new_target_date: string;
    changed_at: string;
}

interface TaskDetail {
    id: string;
    title: string;
    description?: string;
    target_date: string;
    start_time?: string;
    end_time?: string;
    estimated_duration_minutes?: number;
    category_id?: string;
    change_history: ChangeLog[];
}

export function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.taskId as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [originalTask, setOriginalTask] = useState<TaskDetail | null>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetDate, setTargetDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState("");
    const [categoryId, setCategoryId] = useState("");

    // Date Change Modal State
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [changeReason, setChangeReason] = useState("");

    // AI Suggestions States
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";

    // Load initial data
    const loadData = async () => {
        setLoading(true);
        try {
            const cats = await api.get("/categories");
            setCategories(cats);

            const task: TaskDetail = await api.get(`/tasks/${taskId}`);
            setOriginalTask(task);

            setTitle(task.title);
            setDescription(task.description || "");
            setTargetDate(task.target_date);
            setStartTime(task.start_time ? task.start_time.slice(0, 5) : "");
            setEndTime(task.end_time ? task.end_time.slice(0, 5) : "");
            setEstimatedDuration(task.estimated_duration_minutes ? String(task.estimated_duration_minutes) : "");
            setCategoryId(task.category_id || "");
        } catch (err: any) {
            setError(err.message || "Failed to load task details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            loadData();
        }
    }, [taskId]);

    const fetchSubtaskSuggestions = async () => {
        setLoadingSuggestions(true);
        setSuggestionsError(null);
        try {
            const res = await suggestSubtasks(title, description);
            setSuggestions(res);
        } catch (err) {
            console.error("Failed to load subtask suggestions", err);
            setSuggestions([]);
            setSuggestionsError(
                isQuotaExceededError(err)
                    ? getApiErrorMessage(err, "Monthly AI token quota exceeded.")
                    : "Failed to generate subtask suggestions. Please try again."
            );
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const appendSubtaskToDescription = (subtask: string) => {
        const currentDesc = description ? description.trim() : "";
        const bullet = `- [ ] ${subtask}`;
        const newDesc = currentDesc ? `${currentDesc}\n${bullet}` : bullet;
        setDescription(newDesc);
    };

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!originalTask) return;

        // Check if date changed
        if (targetDate !== originalTask.target_date) {
            setChangeReason("");
            setRescheduleModalOpen(true);
        } else {
            submitUpdate(null);
        }
    };

    const submitUpdate = async (reason: string | null) => {
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
                change_reason: reason,
            };

            await api.put(`/tasks/${taskId}`, body);
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to update task.");
        } finally {
            setSubmitting(false);
            setRescheduleModalOpen(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to permanently delete this task?")) {
            setSubmitting(true);
            try {
                await api.delete(`/tasks/${taskId}`);
                router.push("/");
            } catch (err: any) {
                setError(err.message || "Failed to delete task.");
                setSubmitting(false);
            }
        }
    };

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4, maxWidth: "700px", mx: "auto", width: "100%" }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                        Edit Task
                    </Typography>
                </Box>
                <IconButton 
                    onClick={handleDelete}
                    disabled={submitting}
                    sx={{ 
                        color: "#FF6B6B", 
                        border: "1px solid rgba(255, 107, 107, 0.15)",
                        backgroundColor: "rgba(255, 107, 107, 0.03)",
                        "&:hover": {
                            backgroundColor: "rgba(255, 107, 107, 0.1)",
                        }
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
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

                            <form onSubmit={handleSaveClick} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <TextField
                                    label="Task Title"
                                    required
                                    fullWidth
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />

                                <TextField
                                    label="Description"
                                    multiline
                                    rows={3}
                                    fullWidth
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
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
                                            fullWidth
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                        >
                                            <MenuItem value="">
                                                <em>None (Uncategorized)</em>
                                            </MenuItem>
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
                                    {submitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </Card>
                    </motion.div>

                    {/* AI Subtask Suggestions Card */}
                    {originalTask && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <Card sx={{ 
                                p: { xs: 2.5, sm: 4 }, 
                                background: isDark 
                                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)" 
                                    : "linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)",
                                border: "1px solid",
                                borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.1)",
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <AutoAwesomeIcon sx={{ color: "#8B5CF6" }} />
                                    AI Subtask Generator
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                                    Analyze the task title and description to auto-generate a breakdown of subtasks.
                                </Typography>

                                {suggestionsError && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        {suggestionsError}
                                    </Alert>
                                )}
                                
                                <Button
                                    variant="outlined"
                                    onClick={fetchSubtaskSuggestions}
                                    disabled={loadingSuggestions}
                                    startIcon={loadingSuggestions ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                                    sx={{ mb: suggestions.length > 0 ? 3 : 0, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                                >
                                    {loadingSuggestions ? "Generating..." : "Generate Actionable Subtasks"}
                                </Button>

                                {suggestions.length > 0 && (
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 850, color: "primary.main", mb: 1.5 }}>
                                            Suggested Action Steps:
                                        </Typography>
                                        <List sx={{ display: "flex", flexDirection: "column", gap: 1, p: 0 }}>
                                            {suggestions.map((sub, idx) => (
                                                <ListItem 
                                                    key={idx}
                                                    sx={{ 
                                                        py: 1, 
                                                        px: 2, 
                                                        borderRadius: 2, 
                                                        backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "rgba(124, 58, 237, 0.02)",
                                                        border: "1px dashed",
                                                        borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.15)",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {sub}
                                                    </Typography>
                                                    <Button 
                                                        size="small" 
                                                        onClick={() => appendSubtaskToDescription(sub)}
                                                        sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700 }}
                                                    >
                                                        + Add to Desc
                                                    </Button>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {/* Change Log History Card */}
                    {originalTask && originalTask.change_history && originalTask.change_history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card sx={{ p: { xs: 2.5, sm: 4 }, background: "rgba(18, 17, 36, 0.3)" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <HistoryIcon sx={{ color: "#8B5CF6" }} />
                                    Rescheduling Audit History
                                </Typography>
                                <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {originalTask.change_history.map((log) => (
                                        <ListItem 
                                            key={log.id} 
                                            disablePadding
                                            sx={{ 
                                                p: { xs: 1.5, sm: 2 }, 
                                                borderRadius: 3, 
                                                backgroundColor: "rgba(255,255,255,0.02)",
                                                border: "1px solid rgba(139, 92, 246, 0.05)",
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                                                            {log.original_target_date} &rarr; {log.new_target_date}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                            {new Date(log.changed_at).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, fontStyle: "italic" }}>
                                                        &ldquo;{log.reason}&rdquo;
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Card>
                        </motion.div>
                    )}
                </Box>
            )}

            {/* Rescheduling Reason Dialog */}
            <Dialog 
                open={rescheduleModalOpen} 
                onClose={() => setRescheduleModalOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: "background.paper",
                            backgroundImage: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "20px",
                            p: 1.5,
                            width: "100%",
                            maxWidth: "500px",
                        }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: "22px", pb: 1 }}>
                    Rescheduling Audit Required
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "10px !important" }}>
                    <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                        You are changing the target date of this task. Providing an audit reason is mandatory.
                    </Typography>
                    
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, p: 2, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.02)", my: 1 }}>
                        <Typography variant="body2" sx={{ textDecoration: "line-through", color: "#FF6B6B" }}>
                            {originalTask?.target_date}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>&rarr;</Typography>
                        <Typography variant="body2" sx={{ color: "#2ECB71", fontWeight: 700 }}>
                            {targetDate}
                        </Typography>
                    </Box>
                    
                    <TextField
                        label="Reason for Rescheduling"
                        placeholder="Provide a detailed audit reason..."
                        required
                        multiline
                        rows={3}
                        fullWidth
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRescheduleModalOpen(false)} sx={{ color: "#9CA3AF" }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => submitUpdate(changeReason)} 
                        variant="contained" 
                        color="primary"
                        disabled={!changeReason.trim() || submitting}
                    >
                        Save Rescheduled Date
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
