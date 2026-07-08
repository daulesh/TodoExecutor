"use client";

import { Box, Card, Checkbox, Typography } from "@mui/material";
import { CheckCircleOutlined, CircleOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import type { Task } from "@/types";
import { ROUTES } from "@/constants/routes";

interface TaskRowProps {
    task: Task;
    onToggle: (taskId: string, isCompleted: boolean) => void;
    variant?: "default" | "compact";
}

export function TaskRow({ task, onToggle, variant = "default" }: TaskRowProps) {
    const router = useRouter();
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";
    const iconSize = variant === "compact" ? 24 : 28;

    return (
        <Card
            sx={{
                p: variant === "compact" ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 2.5 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderLeft: `5px solid ${task.category?.color_hex || (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(124, 58, 237, 0.2)")}`,
                transition: "all 0.25s ease-in-out",
                opacity: task.is_completed ? 0.55 : 1,
                backgroundColor: variant === "compact"
                    ? isDark ? "rgba(255,255,255,0.01)" : "rgba(124, 58, 237, 0.02)"
                    : undefined,
                border: variant === "compact" ? "1px solid" : undefined,
                borderColor: variant === "compact"
                    ? isDark ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.08)"
                    : undefined,
                "&:hover": {
                    boxShadow: "0 8px 24px rgba(139, 92, 246, 0.12)",
                    transform: "translateY(-2px)",
                },
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}>
                <Checkbox
                    icon={
                        <CircleOutlined
                            sx={{
                                color: isDark ? "rgba(255,255,255,0.3)" : "rgba(124, 58, 237, 0.35)",
                                fontSize: iconSize,
                            }}
                        />
                    }
                    checkedIcon={<CheckCircleOutlined sx={{ color: "#2ECB71", fontSize: iconSize }} />}
                    checked={task.is_completed}
                    onChange={(e) => onToggle(task.id, e.target.checked)}
                />
                <Box
                    onClick={() => router.push(ROUTES.taskDetail(task.id))}
                    sx={{ cursor: "pointer", flexGrow: 1 }}
                >
                    <Typography
                        variant={variant === "compact" ? "body2" : "body1"}
                        sx={{
                            fontWeight: 700,
                            fontSize: variant === "compact" ? "15px" : "16px",
                            textDecoration: task.is_completed ? "line-through" : "none",
                            color: task.is_completed ? "text.secondary" : "text.primary",
                        }}
                    >
                        {task.title}
                    </Typography>
                    {task.description && variant === "default" && (
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
                        {variant === "compact" ? (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Target date: {task.target_date} {task.start_time ? ` @ ${task.start_time}` : ""}
                            </Typography>
                        ) : (
                            <>
                                {task.start_time && (
                                    <Typography variant="caption" sx={{ color: "#8B5CF6", fontWeight: 600 }}>
                                        {task.start_time} {task.end_time ? ` - ${task.end_time}` : ""}
                                    </Typography>
                                )}
                                {task.category && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Box
                                            sx={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                backgroundColor: task.category.color_hex,
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {task.category.title}
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Card>
    );
}
