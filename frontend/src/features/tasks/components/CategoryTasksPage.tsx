"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/fetcher";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { generatePlan } from "@/features/agent/api/agent-api";
import { PlannerCard } from "@/features/agent/components/PlannerCard";
import { PageHeader, LoadingCenter, ErrorAlert } from "@/components/ui";
import { CompletionModal } from "@/components/shared";
import { getCategories, getTasks } from "@/features/tasks/api/tasks-api";
import type { Category, Task } from "@/types";
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

export function CategoryTasksPage() {
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
            const cats = await getCategories();
            setCategories(cats);
            const allTasks = await getTasks();
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
            const response = await generatePlan(plannerQuery);
            setPlannerResponse(response);
            const cats = await getCategories();
            setCategories(cats);
            const allTasks = await getTasks();
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

            <PlannerCard
                query={plannerQuery}
                response={plannerResponse}
                loading={loadingPlanner}
                error={plannerError}
                onQueryChange={setPlannerQuery}
                onGenerate={handleGeneratePlan}
            />

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
