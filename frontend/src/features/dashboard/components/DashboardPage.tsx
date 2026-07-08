/**
 * Today's schedule and main dashboard page for TaskExecutor.
 * Renders daily calendar mini-view, task progress metrics, category filter tabs, list of active tasks, and daily AI briefings.
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/fetcher";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { getBriefing } from "@/features/agent/api/agent-api";
import { BriefingCard } from "@/features/agent/components/BriefingCard";
import { PageHeader, LoadingCenter, CategoryChip, GradientButton } from "@/components/ui";
import { CompletionModal } from "@/components/shared";
import { useTaskCompletion } from "@/features/tasks/hooks/use-task-completion";
import { getCategories, getTasks } from "@/features/tasks/api/tasks-api";
import type { Category, Task } from "@/types";
import { useTheme } from "@mui/material/styles";
import { 
    Typography, 
    Box, 
    Card, 
    Checkbox, 
    Chip, 
    Fab, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    CircularProgress,
    IconButton,
    Grid,
} from "@mui/material";
import { 
    Add as AddIcon, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircleOutlined, 
    CircleOutlined,
    AutoAwesome as AutoAwesomeIcon
} from "@mui/icons-material";

/**
 * Renders the main dashboard panel displaying tasks scheduled for the selected date.
 * Loads categories, tasks, and AI daily briefings, and supports date navigation, category filtering, task completion logging, and manual task creation.
 */
export function DashboardPage() {
    const router = useRouter();
    const theme = useTheme();
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Calendar helper state (Today is the default)
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [weekDays, setWeekDays] = useState<Date[]>([]);

    // Task completion modal state
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
    const [actualDuration, setActualDuration] = useState("");
    const [completionNotes, setCompletionNotes] = useState("");

    // AI Daily Briefing states
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loadingBriefing, setLoadingBriefing] = useState(true);

    // Setup week days array based on currentDate
    useEffect(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(startOfWeek);
            nextDay.setDate(startOfWeek.getDate() + i);
            days.push(nextDay);
        }
        setWeekDays(days);
    }, [currentDate]);

    // Load initial tasks and categories
    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Get categories
            const cats = await getCategories();
            setCategories(cats);

            const todayStr = currentDate.toISOString().split("T")[0];
            const fetchedTasks = await getTasks(todayStr);
            setTasks(fetchedTasks);
        } catch (err) {
            console.error("Error loading dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchBriefing = async () => {
            try {
                const briefingText = await getBriefing();
                setBriefing(briefingText);
            } catch (err) {
                console.error("Failed to load briefing", err);
            } finally {
                setLoadingBriefing(false);
            }
        };
        fetchBriefing();
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [currentDate]);

    const navigateWeek = (weeksDiff: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + weeksDiff * 7);
        setCurrentDate(newDate);
    };

    const handleDateSelect = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0];
        router.push(`/date/${dateStr}`);
    };

    const handleCheckboxToggle = (taskId: string, isCompleted: boolean) => {
        if (isCompleted) {
            // If checking complete, open notes modal
            setTaskToComplete(taskId);
            setActualDuration("");
            setCompletionNotes("");
            setCompleteModalOpen(true);
        } else {
            // If unchecking, immediately send request to reopen task
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
            
            // Update local state
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

    const filteredTasks = selectedCategory
        ? tasks.filter((t) => t.category_id === selectedCategory)
        : tasks;

    // Formatting date helper
    const formattedDate = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const isToday = (d: Date) => {
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
            {/* Header section */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-1.5px", fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}>
                        Today
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                        {formattedDate}
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => router.push("/tasks/new")}
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

            <BriefingCard loading={loadingBriefing} briefing={briefing} />

            {/* Horizontal week calendar */}
            <Card
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    backgroundColor: isDark ? "rgba(18, 17, 36, 0.45)" : "background.paper",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.1)",
                    boxShadow: isDark ? undefined : "0 4px 20px rgba(124, 58, 237, 0.06)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                        Calendar Mini-View
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton size="small" onClick={() => navigateWeek(-1)} sx={{ color: "text.secondary" }}>
                            <ChevronLeft />
                        </IconButton>
                        <IconButton size="small" onClick={() => navigateWeek(1)} sx={{ color: "text.secondary" }}>
                            <ChevronRight />
                        </IconButton>
                    </Box>
                </Box>
                
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: { xs: 0.5, sm: 1 } }}>
                    {weekDays.map((day, idx) => {
                        const active = isToday(day);
                        const weekdayStr = day.toLocaleDateString("en-US", { weekday: "short" });
                        const dayNum = day.getDate();
                        
                        return (
                            <Box key={idx} sx={{ flex: "1 1 0px", maxWidth: "60px", display: "flex", justifyContent: "center" }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDateSelect(day)}
                                    style={{
                                        background: active
                                            ? "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                                            : isDark
                                              ? "transparent"
                                              : "rgba(124, 58, 237, 0.05)",
                                        color: active ? "#FFF" : theme.palette.text.secondary,
                                        borderRadius: "12px",
                                        width: "100%",
                                        height: "70px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: "8px 2px",
                                        border: active
                                            ? "none"
                                            : isDark
                                              ? "1px solid rgba(139, 92, 246, 0.1)"
                                              : "1px solid rgba(124, 58, 237, 0.12)",
                                        boxShadow: active ? "0 4px 12px rgba(139, 92, 246, 0.3)" : "none",
                                    }}
                                >
                                    <span style={{ fontSize: "10px", fontWeight: 700, opacity: active ? 0.9 : 0.6, textTransform: "uppercase" }}>
                                        {weekdayStr}
                                    </span>
                                    <span style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>
                                        {dayNum}
                                    </span>
                                </motion.button>
                            </Box>
                        );
                    })}
                </Box>
            </Card>

            {/* Category Filter Chips */}
            <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
                <Chip
                    label="All Tasks"
                    clickable
                    color={selectedCategory === null ? "primary" : "default"}
                    onClick={() => setSelectedCategory(null)}
                    sx={{ px: 1, py: 2.2, fontSize: "14px", fontWeight: 600, borderRadius: "12px" }}
                />
                {categories.map((cat) => (
                    <Chip
                        key={cat.id}
                        label={cat.title}
                        clickable
                        onClick={() => setSelectedCategory(cat.id)}
                        sx={{ 
                            px: 1, 
                            py: 2.2, 
                            fontSize: "14px", 
                            fontWeight: 600, 
                            borderRadius: "12px",
                            borderLeft: `4px solid ${cat.color_hex}`,
                            backgroundColor: selectedCategory === cat.id ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.03)",
                            color: selectedCategory === cat.id ? "primary.main" : "text.primary",
                            borderColor: selectedCategory === cat.id ? "primary.main" : "divider",
                        }}
                    />
                ))}
            </Box>

            {/* Tasks Section */}
            <Box sx={{ flexGrow: 1 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress color="primary" />
                    </Box>
                ) : filteredTasks.length === 0 ? (
                    <Card 
                        sx={{ 
                            p: 6, 
                            textAlign: "center", 
                            backgroundColor: isDark ? "rgba(18, 17, 36, 0.2)" : "rgba(124, 58, 237, 0.03)",
                            borderStyle: "dashed",
                            borderWidth: "1.5px",
                            borderColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.15)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <CheckCircleOutlined sx={{ fontSize: 48, color: isDark ? "rgba(139, 92, 246, 0.3)" : "rgba(124, 58, 237, 0.35)" }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>No tasks scheduled</Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>You are all caught up for today!</Typography>
                        </Box>
                        <Button component={Link} href="/tasks/new" variant="outlined" color="primary" sx={{ mt: 1 }}>
                            Create New Task
                        </Button>
                    </Card>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <AnimatePresence initial={false}>
                            {filteredTasks.map((task) => (
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
                                            borderLeft: `5px solid ${task.category?.color_hex || (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(124, 58, 237, 0.2)")}`,
                                            transition: "all 0.25s ease-in-out",
                                            opacity: task.is_completed ? 0.55 : 1,
                                            "&:hover": {
                                                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.12)",
                                                transform: "translateY(-2px)",
                                                borderColor: task.category?.color_hex || (isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(124, 58, 237, 0.25)"),
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
                                            <Checkbox
                                                icon={<CircleOutlined sx={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(124, 58, 237, 0.35)", fontSize: 28 }} />}
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
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: "text.secondary", 
                                                            mt: 0.5,
                                                            fontSize: "13px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 1,
                                                            WebkitBoxOrient: "vertical",
                                                        }}
                                                    >
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
                                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
                    <Button onClick={() => setCompleteModalOpen(false)} sx={{ color: "text.secondary" }}>
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
