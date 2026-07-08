"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAnalyticsSummary, exportWorkspaceJson } from "@/features/analytics/api/analytics-api";
import { getInsights } from "@/features/agent/api/agent-api";
import { InsightsCoach } from "@/features/agent/components/InsightsCoach";
import { PageHeader, LoadingCenter } from "@/components/ui";
import type { AnalyticsData } from "@/types";
import { 
    Typography, 
    Box, 
    Card, 
    Grid, 
    CircularProgress,
    Button,
    LinearProgress,
    Divider,
    TextField,
    Alert,
} from "@mui/material";
import { 
    CloudDownload as DownloadIcon, 
    TrendingUp, 
    AssignmentLate, 
    DateRange, 
    StarHalf,
    AutoAwesome as CoachIcon,
    Psychology as PsychologyIcon
} from "@mui/icons-material";

export function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    
    // AI Coach states
    const [coachQuery, setCoachQuery] = useState("Analyze my current task execution statistics and give me coaching advice.");
    const [coachResponse, setCoachResponse] = useState<string | null>(null);
    const [loadingCoach, setLoadingCoach] = useState(false);
    const [coachError, setCoachError] = useState<string | null>(null);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const summary = await getAnalyticsSummary();
            setData(summary);
        } catch (err) {
            console.error("Failed to load analytics summary", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const handleExportJson = async () => {
        setExporting(true);
        try {
            const dbData = await exportWorkspaceJson();
            
            // Format and trigger download in browser
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(dbData, null, 2)
            )}`;
            
            const downloadAnchor = document.createElement("a");
            const dateStr = new Date().toISOString().split("T")[0];
            
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", `task_executor_backup_${dateStr}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setExporting(false);
        }
    };

    const handleConsultCoach = async () => {
        setLoadingCoach(true);
        setCoachError(null);
        try {
            const response = await getInsights(coachQuery);
            setCoachResponse(response);
        } catch (err: any) {
            console.error("Coach query failed", err);
            setCoachError(err.message || "Failed to contact the AI Coach.");
        } finally {
            setLoadingCoach(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-1.5px", fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" } }}>
                    Analytics
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "#9CA3AF", fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Insights, task execution metrics, and data export tools
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress color="primary" />
                </Box>
            ) : !data ? (
                <Typography variant="body1" sx={{ color: "#FF6B6B" }}>
                    Failed to fetch analytics summary data.
                </Typography>
            ) : (
                <Grid container spacing={4}>
                    {/* Primary Stats Grid */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={3}>
                            {/* Completion rate card */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, minHeight: { xs: 110, sm: 140 }, height: "100%" }}>
                                        <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                                            <CircularProgress 
                                                variant="determinate" 
                                                value={data.completion_rate} 
                                                size={80} 
                                                thickness={6}
                                                sx={{ color: "#2ECB71" }}
                                            />
                                            <Box
                                                sx={{
                                                    top: 0,
                                                    left: 0,
                                                    bottom: 0,
                                                    right: 0,
                                                    position: "absolute",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "14px" }}>
                                                    {Math.round(data.completion_rate)}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                                                Completion Rate
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                                                {data.completed_tasks} / {data.total_tasks}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                                Completed Tasks
                                            </Typography>
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>

                            {/* Overdue tasks card */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <Card sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, minHeight: { xs: 110, sm: 140 }, height: "100%" }}>
                                        <Box sx={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <AssignmentLate sx={{ fontSize: 32, color: "#FF6B6B" }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                                                Overdue Tasks
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: data.overdue_tasks > 0 ? "#FF6B6B" : "text.primary" }}>
                                                {data.overdue_tasks}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                                Pending past target dates
                                            </Typography>
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>

                            {/* Rescheduling history card */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <Card sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, minHeight: { xs: 110, sm: 140 }, height: "100%" }}>
                                        <Box sx={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <DateRange sx={{ fontSize: 32, color: "#8B5CF6" }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                                                Reschedules
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
                                                {data.date_change_count}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                                Total target-date updates
                                            </Typography>
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>

                            {/* Most Rescheduled Task Card */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <Card sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, minHeight: { xs: 110, sm: 140 }, height: "100%" }}>
                                        <Box sx={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <StarHalf sx={{ fontSize: 32, color: "#F59E0B" }} />
                                        </Box>
                                        <Box sx={{ overflow: "hidden", minWidth: 0, width: "100%" }}>
                                            <Typography variant="subtitle2" sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                                                Reschedule Peak
                                            </Typography>
                                            {data.most_rescheduled_task ? (
                                                <>
                                                    <Typography 
                                                        variant="h6" 
                                                        noWrap
                                                        sx={{ 
                                                            fontWeight: 850, 
                                                            mt: 0.5, 
                                                            textOverflow: "ellipsis",
                                                            overflow: "hidden",
                                                            fontSize: "15px"
                                                        }}
                                                    >
                                                        {data.most_rescheduled_task.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 600 }}>
                                                        Rescheduled {data.most_rescheduled_task.reschedule_count} times
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, fontSize: "15px" }}>
                                                        None
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                                        No date changes recorded
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Card>
                                </motion.div>
                            </Grid>
                        </Grid>

                        {/* Category performance breakdown list */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                            <Card sx={{ p: { xs: 2.5, sm: 4 }, mt: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                                    Category Performance
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                                    {data.tasks_by_category.map((cat, idx) => {
                                        const rate = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                                        return (
                                            <Box key={idx}>
                                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {cat.category_name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#9CA3AF" }}>
                                                        {cat.completed}/{cat.total} completed ({rate}%)
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={rate} 
                                                    sx={{ 
                                                        height: 8, 
                                                        borderRadius: 4,
                                                        backgroundColor: "rgba(255,255,255,0.03)",
                                                        "& .MuiLinearProgress-bar": {
                                                            backgroundColor: cat.category_name === "Work" ? "#FF6B6B" : cat.category_name === "Personal" ? "#6C63FF" : cat.category_name === "Other" ? "#2ECB71" : "#9CA3AF"
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Card>
                        </motion.div>

                        <InsightsCoach
                            query={coachQuery}
                            response={coachResponse}
                            loading={loadingCoach}
                            error={coachError}
                            onQueryChange={setCoachQuery}
                            onConsult={handleConsultCoach}
                        />
                    </Grid>

                    {/* Data Archive & Export Panel */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <Card sx={{ p: { xs: 2.5, sm: 4 }, background: "rgba(139, 92, 246, 0.05)", border: "1px solid rgba(139, 92, 246, 0.15)", height: "100%" }}>
                                <Box sx={{ width: 56, height: 56, borderRadius: 3, backgroundColor: "rgba(139, 92, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
                                    <DownloadIcon sx={{ fontSize: 30, color: "#8B5CF6" }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                                    Backup Data
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#9CA3AF", lineHeight: 1.7, mb: 4 }}>
                                    Export your entire workspace, including categories, tasks, and target-date rescheduling log audits in a single JSON document. 
                                </Typography>
                                
                                <Divider sx={{ opacity: 0.1, mb: 4 }} />
                                
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    fullWidth
                                    startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                    onClick={handleExportJson}
                                    disabled={exporting}
                                    sx={{ 
                                        height: 52,
                                        background: "linear-gradient(135deg, #2ECB71 0%, #047857 100%)",
                                        boxShadow: "0 4px 12px rgba(46, 203, 113, 0.2)",
                                        "&:hover": {
                                            boxShadow: "0 6px 16px rgba(46, 203, 113, 0.35)",
                                        }
                                    }}
                                >
                                    {exporting ? "Preparing Backup..." : "Export Workspace JSON"}
                                </Button>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
