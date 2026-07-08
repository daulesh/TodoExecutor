/**
 * Daily schedule view page for TaskExecutor.
 * Renders list of tasks for the specified date param, with task navigation, status toggles, and task creation access.
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/fetcher";
import { 
    Typography, 
    Box, 
    Card, 
    Checkbox, 
    Fab, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    CircularProgress,
    IconButton,
} from "@mui/material";
import { 
    Add as AddIcon, 
    ChevronLeft, 
    ChevronRight, 
    ArrowBack, 
    CheckCircleOutlined, 
    CircleOutlined 
} from "@mui/icons-material";

interface Category {
    id: string;
    title: string;
    color_hex: string;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    target_date: string;
    start_time?: string;
    end_time?: string;
    is_completed: boolean;
    category_id?: string;
    category?: Category;
}

/**
 * Serves as the page view for a specific date, displaying all scheduled tasks for that day.
 * Allows users to toggle task completion, navigate to adjacent days, or create a new task preset to the current date view.
 */
export function DateViewPage() {
    const router = useRouter();
    const params = useParams();
    const dateParam = params.date as string; // YYYY-MM-DD

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Complete modal states
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
    const [actualDuration, setActualDuration] = useState("");
    const [completionNotes, setCompletionNotes] = useState("");

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/tasks?date=${dateParam}`);
            setTasks(data);
        } catch (err) {
            console.error("Failed to load tasks for date", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dateParam) {
            loadTasks();
        }
    }, [dateParam]);

    const navigateDate = (daysDiff: number) => {
        const current = new Date(dateParam);
        current.setDate(current.getDate() + daysDiff);
        const nextDateStr = current.toISOString().split("T")[0];
        router.push(`/date/${nextDateStr}`);
    };

    const handleCheckboxToggle = (taskId: string, isCompleted: boolean) => {
        if (isCompleted) {
            setTaskToComplete(taskId);
            setActualDuration("");
            setCompletionNotes("");
            setCompleteModalOpen(true);
        } else {
            toggleTaskCompletion(taskId, false);
        }
    };

    const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
        try {
            const body = {
                is_completed: isCompleted,
                actual_duration_minutes: isCompleted && actualDuration ? parseInt(actualDuration) : null,
                completion_notes: isCompleted && completionNotes ? completionNotes : null,
            };
            const updatedTask = await api.patch(`/tasks/${taskId}/complete`, body);
            
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: updatedTask.is_completed } : t));
        } catch (err) {
            console.error("Failed to complete task", err);
        }
    };

    const confirmCompletion = () => {
        if (taskToComplete) {
            toggleTaskCompletion(taskToComplete, true);
            setCompleteModalOpen(false);
            setTaskToComplete(null);
        }
    };

    // Date formatting for header
    const parsedDate = new Date(dateParam);
    const formattedDate = parsedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
            {/* Header / Nav area */}
            <Box sx={{ 
                display: "flex", 
                flexDirection: { xs: "column", md: "row" }, 
                justifyContent: "space-between", 
                alignItems: { xs: "stretch", md: "center" }, 
                gap: 2 
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1, overflow: "hidden" }}>
                    <IconButton 
                        onClick={() => router.push("/")} 
                        sx={{ 
                            color: "#9ca3af",
                            border: "1px solid rgba(255,255,255,0.05)",
                            backgroundColor: "rgba(255,255,255,0.02)",
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ overflow: "hidden" }}>
                        <Typography variant="subtitle2" sx={{ color: "#8B5CF6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", fontSize: { xs: "11px", sm: "13px" } }}>
                            Schedule Date View
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: "-1px", fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}>
                            {formattedDate}
                        </Typography>
                    </Box>
                </Box>
                
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", alignSelf: { xs: "flex-end", md: "auto" } }}>
                    {/* Previous/Next Day navigation */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton 
                            onClick={() => navigateDate(-1)} 
                            sx={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton 
                            onClick={() => navigateDate(1)} 
                            sx={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </Box>

                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => router.push(`/tasks/new?date=${dateParam}`)}
                        sx={{ 
                            borderRadius: 3, 
                            py: 1.2, 
                            px: 3, 
                            fontWeight: 700,
                            boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                            textTransform: "none",
                            height: "fit-content",
                            "&:hover": {
                                background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                                boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
                            }
                        }}
                    >
                        Create Task
                    </Button>
                </Box>
            </Box>

            {/* Task list section */}
            <Box sx={{ flexGrow: 1 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : tasks.length === 0 ? (
                    <Card 
                        sx={{ 
                            p: { xs: 3, sm: 6 }, 
                            textAlign: "center", 
                            background: "rgba(18, 17, 36, 0.2)",
                            borderStyle: "dashed",
                            borderWidth: "1.5px",
                            borderColor: "rgba(139, 92, 246, 0.2)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <CheckCircleOutlined sx={{ fontSize: 48, color: "rgba(139, 92, 246, 0.3)" }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>No tasks scheduled for this day</Typography>
                            <Typography variant="body2" sx={{ color: "#9CA3AF" }}>Plan ahead and add some items to your list!</Typography>
                        </Box>
                        <Button component={Link} href={`/tasks/new?date=${dateParam}`} variant="outlined" color="primary" sx={{ mt: 1 }}>
                            Create Task for this Date
                        </Button>
                    </Card>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <AnimatePresence initial={false}>
                            {tasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card 
                                        sx={{ 
                                            p: { xs: 2, sm: 2.5 }, 
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "space-between",
                                            borderLeft: `5px solid ${task.category?.color_hex || "rgba(255, 255, 255, 0.15)"}`,
                                            transition: "all 0.25s ease-in-out",
                                            opacity: task.is_completed ? 0.55 : 1,
                                            "&:hover": {
                                                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.12)",
                                                transform: "translateY(-2px)",
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
                                            <Checkbox
                                                icon={<CircleOutlined sx={{ color: "rgba(255,255,255,0.3)", fontSize: 28 }} />}
                                                checkedIcon={<CheckCircleOutlined sx={{ color: "#2ECB71", fontSize: 28 }} />}
                                                checked={task.is_completed}
                                                onChange={(e) => handleCheckboxToggle(task.id, e.target.checked)}
                                            />
                                            <Box 
                                                onClick={() => router.push(`/tasks/${task.id}`)}
                                                sx={{ cursor: "pointer", flexGrow: 1 }}
                                            >
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        fontSize: "16px",
                                                        textDecoration: task.is_completed ? "line-through" : "none",
                                                        color: task.is_completed ? "text.secondary" : "text.primary",
                                                    }}
                                                >
                                                    {task.title}
                                                </Typography>
                                                
                                                {task.description && (
                                                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "13px" }}>
                                                        {task.description}
                                                    </Typography>
                                                )}
                                                
                                                <Box sx={{ display: "flex", gap: 2, mt: 1, alignItems: "center" }}>
                                                    {task.start_time && (
                                                        <Typography variant="caption" sx={{ color: "#8B5CF6", fontWeight: 600 }}>
                                                            {task.start_time} {task.end_time ? ` - ${task.end_time}` : ""}
                                                        </Typography>
                                                    )}
                                                    {task.category && (
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: task.category.color_hex }} />
                                                            <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                                                {task.category.title}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Box>
                )}
            </Box>

            {/* Task completion modal */}
            <Dialog 
                open={completeModalOpen} 
                onClose={() => setCompleteModalOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: "background.paper",
                            backgroundImage: "none",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "20px",
                            p: 1.5,
                        }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: "22px", pb: 1 }}>
                    Mark Task Complete
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: "10px !important" }}>
                    <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                        Optional: record your completion logs and time spent to populate productivity metrics.
                    </Typography>
                    
                    <TextField
                        label="Actual Duration (minutes)"
                        type="number"
                        placeholder="e.g. 45"
                        fullWidth
                        value={actualDuration}
                        onChange={(e) => setActualDuration(e.target.value)}
                    />
                    
                    <TextField
                        label="Completion Notes"
                        placeholder="What went well? Any follow ups?"
                        multiline
                        rows={3}
                        fullWidth
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCompleteModalOpen(false)} sx={{ color: "#9CA3AF" }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmCompletion} variant="contained" color="secondary">
                        Confirm Complete
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
