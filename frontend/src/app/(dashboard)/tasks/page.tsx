"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/fetcher";
import { useThemeMode } from "@/components/providers/Providers";
import { 
    Typography, 
    Box, 
    Card, 
    Checkbox, 
    Chip,
    Button, 
    CircularProgress,
    List,
    ListItem,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from "@mui/material";
import { 
    ExpandMore as ExpandMoreIcon, 
    CheckCircleOutlined, 
    CircleOutlined, 
    Add as AddIcon,
    Folder as FolderIcon,
    AutoAwesome as AutoAwesomeIcon
} from "@mui/icons-material";

interface Category {
    id: string;
    title: string;
    color_hex: string;
    icon?: string;
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

export default function CategoryTasksPage() {
    const router = useRouter();
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";

    const accordionSx = {
        backgroundColor: isDark ? "rgba(18, 17, 36, 0.3)" : "background.paper",
        border: "1px solid",
        borderColor: isDark ? "rgba(139, 92, 246, 0.08)" : "rgba(124, 58, 237, 0.1)",
        boxShadow: isDark ? undefined : "0 4px 20px rgba(124, 58, 237, 0.05)",
        "&:before": { display: "none" },
    };

    const taskCardSx = {
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "rgba(124, 58, 237, 0.02)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.08)",
        opacity: 1,
        "&:hover": {
            borderColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.2)",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(124, 58, 237, 0.04)",
        },
    };
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Complete modal states
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
    const [actualDuration, setActualDuration] = useState("");
    const [completionNotes, setCompletionNotes] = useState("");

    // AI Planner states
    const [plannerQuery, setPlannerQuery] = useState("");
    const [plannerResponse, setPlannerResponse] = useState<string | null>(null);
    const [loadingPlanner, setLoadingPlanner] = useState(false);
    const [plannerError, setPlannerError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const cats = await api.get("/categories");
            setCategories(cats);

            const allTasks = await api.get("/tasks");
            setTasks(allTasks);
        } catch (err) {
            console.error("Failed to load tasks data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        setLoadingPlanner(true);
        setPlannerError(null);
        try {
            const res = await api.post("/agent/plan", { message: plannerQuery });
            setPlannerResponse(res.response);
            // Refresh categories and tasks instantly
            const cats = await api.get("/categories");
            setCategories(cats);
            const allTasks = await api.get("/tasks");
            setTasks(allTasks);
        } catch (err: any) {
            console.error("Planner generation failed", err);
            setPlannerError(err.message || "Failed to generate tasks using the AI Planner.");
        } finally {
            setLoadingPlanner(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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
            console.error("Failed to update completion", err);
        }
    };

    const confirmCompletion = () => {
        if (taskToComplete) {
            toggleTaskCompletion(taskToComplete, true);
            setCompleteModalOpen(false);
            setTaskToComplete(null);
        }
    };

    // Group tasks by category ID
    const getTasksForCategory = (catId: string | null) => {
        return tasks.filter((t) => t.category_id === catId);
    };

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-1.5px", fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}>
                    Categories
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" }, mb: 2 }}>
                    Manage tasks grouped by system and custom categories
                </Typography>
            </Box>

            {/* AI Task Planner Card */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card sx={{ 
                    p: { xs: 2.5, sm: 4 }, 
                    background: isDark 
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(99, 102, 241, 0.03) 100%)" 
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.1)",
                    mb: 1
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, backgroundColor: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AutoAwesomeIcon sx={{ color: "#8B5CF6" }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                AI Goal & Task Planner
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Describe a project or milestone, and the ADK 2.0 Agent will auto-populate categories and tasks.
                            </Typography>
                        </Box>
                    </Box>

                    {plannerError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                            {plannerError}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="e.g., Plan my Kaggle submission timeline over the next 3 weeks..."
                            value={plannerQuery}
                            onChange={(e) => setPlannerQuery(e.target.value)}
                            disabled={loadingPlanner}
                            sx={{ 
                                backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "white",
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleGeneratePlan}
                            disabled={loadingPlanner || !plannerQuery.trim()}
                            sx={{ 
                                px: 4, 
                                height: 56, 
                                borderRadius: 3,
                                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": {
                                    boxShadow: "0 6px 16px rgba(139, 92, 246, 0.35)",
                                }
                            }}
                        >
                            {loadingPlanner ? <CircularProgress size={24} color="inherit" /> : "Generate Plan"}
                        </Button>
                    </Box>

                    {plannerResponse && (
                        <Box sx={{ 
                            mt: 3, 
                            p: 2.5, 
                            borderRadius: 3, 
                            backgroundColor: isDark ? "rgba(139, 92, 246, 0.02)" : "rgba(124, 58, 237, 0.02)", 
                            border: "1px solid rgba(139, 92, 246, 0.15)",
                            borderLeft: "5px solid #8B5CF6"
                        }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                                Planner Output:
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                {plannerResponse}
                            </Typography>
                        </Box>
                    )}
                </Card>
            </motion.div>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    {/* Render each category */}
                    {categories.map((cat) => {
                        const catTasks = getTasksForCategory(cat.id);
                        return (
                            <Accordion 
                                key={cat.id} 
                                defaultExpanded 
                                sx={accordionSx}
                            >
                                <AccordionSummary 
                                    expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
                                    sx={{ 
                                        borderBottom: "1px solid",
                                        borderColor: isDark ? "rgba(139, 92, 246, 0.05)" : "rgba(124, 58, 237, 0.08)",
                                        px: { xs: 2, sm: 3 }, 
                                        py: 1,
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Box 
                                            sx={{ 
                                                width: 14, 
                                                height: 14, 
                                                borderRadius: "50%", 
                                                backgroundColor: cat.color_hex,
                                                boxShadow: `0 0 10px ${cat.color_hex}`
                                            }} 
                                        />
                                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                            {cat.title}
                                        </Typography>
                                        <Chip 
                                            label={`${catTasks.length} ${catTasks.length === 1 ? 'task' : 'tasks'}`} 
                                            size="small"
                                            sx={{ 
                                                fontSize: "12px", 
                                                fontWeight: 700, 
                                                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.06)",
                                                color: "text.secondary",
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
                                    {catTasks.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                                            No tasks in this category.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                            {catTasks.map((task) => (
                                                <Card 
                                                    key={task.id}
                                                    sx={{
                                                        ...taskCardSx,
                                                        opacity: task.is_completed ? 0.6 : 1,
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <Checkbox
                                                            icon={<CircleOutlined sx={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(124, 58, 237, 0.35)", fontSize: 24 }} />}
                                                            checkedIcon={<CheckCircleOutlined sx={{ color: "#2ECB71", fontSize: 24 }} />}
                                                            checked={task.is_completed}
                                                            onChange={(e) => handleCheckboxToggle(task.id, e.target.checked)}
                                                        />
                                                        <Box 
                                                            onClick={() => router.push(`/tasks/${task.id}`)}
                                                            sx={{ cursor: "pointer" }}
                                                        >
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    fontWeight: 700, 
                                                                    textDecoration: task.is_completed ? "line-through" : "none",
                                                                    color: task.is_completed ? "text.secondary" : "text.primary",
                                                                    fontSize: "15px"
                                                                }}
                                                            >
                                                                {task.title}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                Target date: {task.target_date} {task.start_time ? ` @ ${task.start_time}` : ""}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Card>
                                            ))}
                                        </Box>
                                    )}
                                    <Button 
                                        component={Link}
                                        href={`/tasks/new?category_id=${cat.id}`}
                                        variant="text" 
                                        color="primary" 
                                        startIcon={<AddIcon />}
                                        sx={{ alignSelf: "flex-start", mt: 1, color: cat.color_hex }}
                                    >
                                        Add Task to {cat.title}
                                    </Button>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}

                    {/* Uncategorized list if any exist */}
                    {getTasksForCategory(null).length > 0 && (
                        <Accordion 
                            defaultExpanded
                            sx={accordionSx}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
                                sx={{
                                    borderBottom: "1px solid",
                                    borderColor: isDark ? "rgba(139, 92, 246, 0.05)" : "rgba(124, 58, 237, 0.08)",
                                    px: { xs: 2, sm: 3 },
                                    py: 1,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <FolderIcon sx={{ color: "text.secondary" }} />
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        Uncategorized
                                    </Typography>
                                    <Chip 
                                        label={`${getTasksForCategory(null).length} tasks`} 
                                        size="small"
                                        sx={{
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.06)",
                                            color: "text.secondary",
                                        }}
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    {getTasksForCategory(null).map((task) => (
                                        <Card 
                                            key={task.id}
                                            sx={{
                                                ...taskCardSx,
                                                opacity: task.is_completed ? 0.6 : 1,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Checkbox
                                                    icon={<CircleOutlined sx={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(124, 58, 237, 0.35)", fontSize: 24 }} />}
                                                    checkedIcon={<CheckCircleOutlined sx={{ color: "#2ECB71", fontSize: 24 }} />}
                                                    checked={task.is_completed}
                                                    onChange={(e) => handleCheckboxToggle(task.id, e.target.checked)}
                                                />
                                                <Box 
                                                    onClick={() => router.push(`/tasks/${task.id}`)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontWeight: 700, 
                                                            textDecoration: task.is_completed ? "line-through" : "none",
                                                            color: task.is_completed ? "text.secondary" : "text.primary",
                                                            fontSize: "15px"
                                                        }}
                                                    >
                                                        {task.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                        Target date: {task.target_date} {task.start_time ? ` @ ${task.start_time}` : ""}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Card>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Box>
            )}

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
