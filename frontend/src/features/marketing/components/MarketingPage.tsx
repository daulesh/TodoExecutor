/*
 * Welcome/Marketing landing page for TaskExecutor.
 * Use for public-facing entry point (unauthenticated) that showcases all current features.
 * Renders hero section, AI features highlight band, and 6-card features grid.
 */
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container, Button, Typography, Grid, Card, Box, Chip } from "@mui/material";
import {
    CalendarMonth,
    Equalizer,
    Security,
    ArrowForward,
    AutoAwesome,
    Psychology,
    SmartToy,
    EventRepeat,
    Chat,
    FileDownload,
} from "@mui/icons-material";
import { useThemeMode } from "@/components/providers/ThemeProvider";

/* Feature card data: title, icon, description, color, and optional badge */
const FEATURES = [
    {
        icon: <CalendarMonth sx={{ fontSize: 32, color: "#8B5CF6" }} />,
        title: "Smart Calendar",
        desc: "Plan and view your schedule horizontally or vertically with details about estimated durations.",
        color: "#8B5CF6",
        badge: null,
    },
    {
        icon: <Equalizer sx={{ fontSize: 32, color: "#2ECB71" }} />,
        title: "Advanced Analytics",
        desc: "Track completion rates, average task duration, and reschedule ratios with easy JSON data exports.",
        color: "#2ECB71",
        badge: null,
    },
    {
        icon: <Security sx={{ fontSize: 32, color: "#FF6B6B" }} />,
        title: "Change Log Audit",
        desc: "Every date modification is validated, requiring a change reason. Kept in a secure history log.",
        color: "#FF6B6B",
        badge: null,
    },
    {
        icon: <Psychology sx={{ fontSize: 32, color: "#F59E0B" }} />,
        title: "AI Daily Briefing",
        desc: "Start your day with a personalized AI-generated briefing summarising what's ahead and key priorities.",
        color: "#F59E0B",
        badge: "AI",
    },
    {
        icon: <AutoAwesome sx={{ fontSize: 32, color: "#06B6D4" }} />,
        title: "AI Subtask Generator",
        desc: "Break complex tasks into actionable subtasks instantly with Google Gemini-powered suggestions.",
        color: "#06B6D4",
        badge: "AI",
    },
    {
        icon: <EventRepeat sx={{ fontSize: 32, color: "#EC4899" }} />,
        title: "Smart Rescheduler",
        desc: "An intelligent agent automatically identifies overdue tasks and proposes optimised new target dates.",
        color: "#EC4899",
        badge: "AI",
    },
];

/* AI highlight strip items */
const AI_HIGHLIGHTS = [
    { icon: <Chat sx={{ fontSize: 20, color: "#a78bfa" }} />, label: "Orchestrator Chat" },
    { icon: <Psychology sx={{ fontSize: 20, color: "#F59E0B" }} />, label: "Daily Briefing" },
    { icon: <AutoAwesome sx={{ fontSize: 20, color: "#06B6D4" }} />, label: "Subtask AI" },
    { icon: <EventRepeat sx={{ fontSize: 20, color: "#EC4899" }} />, label: "Smart Reschedule" },
    { icon: <SmartToy sx={{ fontSize: 20, color: "#2ECB71" }} />, label: "Insights Agent" },
    { icon: <FileDownload sx={{ fontSize: 20, color: "#8B5CF6" }} />, label: "JSON Export" },
];

export function MarketingPage() {
    /* Resolves theme mode for conditional styling across sections */
    const { resolvedMode } = useThemeMode();
    const isDark = resolvedMode === "dark";

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: isDark
                    ? "radial-gradient(circle at 10% 20%, rgba(90, 47, 184, 0.15) 0%, rgba(0, 0, 0, 0) 40%), radial-gradient(circle at 90% 80%, rgba(46, 203, 113, 0.1) 0%, rgba(0, 0, 0, 0) 40%), #05040a"
                    : "radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.06) 0%, rgba(0, 0, 0, 0) 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.05) 0%, rgba(0, 0, 0, 0) 40%), #F9FAFB",
                color: "text.primary",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Header / Navbar */}
            <Box
                sx={{
                    px: { xs: 2, sm: 4 },
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    backdropFilter: "blur(12px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 900,
                        letterSpacing: "-0.5px",
                        background: "linear-gradient(135deg, #a78bfa 0%, #2ecb71 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: { xs: "1.2rem", sm: "1.5rem" },
                    }}
                >
                    TaskExecutor
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button component={Link} href="/login" color="inherit" sx={{ opacity: 0.8, "&:hover": { opacity: 1 } }}>
                        Login
                    </Button>
                    <Button component={Link} href="/register" variant="contained" color="primary">
                        Sign Up
                    </Button>
                </Box>
            </Box>

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ flexGrow: 1, display: "flex", alignItems: "center", py: 8 }}>
                <Grid container spacing={6} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            {/* AI-powered badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Chip
                                    icon={<AutoAwesome sx={{ fontSize: "16px !important", color: "#a78bfa !important" }} />}
                                    label="Now with 5 AI-powered Agents"
                                    size="small"
                                    sx={{
                                        mb: 2,
                                        background: isDark
                                            ? "rgba(167, 139, 250, 0.12)"
                                            : "rgba(124, 58, 237, 0.08)",
                                        border: "1px solid",
                                        borderColor: isDark ? "rgba(167, 139, 250, 0.3)" : "rgba(124, 58, 237, 0.2)",
                                        color: isDark ? "#a78bfa" : "#7C3AED",
                                        fontWeight: 600,
                                        fontSize: "0.75rem",
                                    }}
                                />
                            </motion.div>

                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 900,
                                    lineHeight: 1.15,
                                    letterSpacing: "-1.5px",
                                    mb: 2,
                                    background: isDark
                                        ? "linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)"
                                        : "linear-gradient(135deg, #111827 0%, #6D28D9 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
                                }}
                            >
                                Track. Execute.<br />
                                <span
                                    style={{
                                        background: "linear-gradient(135deg, #a78bfa 0%, #2ecb71 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    Achieve.
                                </span>
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: "text.secondary",
                                    mb: 4,
                                    fontWeight: 400,
                                    maxWidth: "480px",
                                    fontSize: { xs: "1rem", sm: "1.25rem" },
                                }}
                            >
                                A premium personal task scheduler with an integrated calendar, AI-powered daily briefings, smart rescheduling, and a conversational AI assistant — all in one place.
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: { xs: "100%", sm: "auto" } }}>
                                <Button
                                    component={Link}
                                    href="/register"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    endIcon={<ArrowForward />}
                                    sx={{ height: 52, px: 4, width: { xs: "100%", sm: "auto" } }}
                                >
                                    Get Started
                                </Button>
                                <Button
                                    component={Link}
                                    href="/login"
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    sx={{
                                        height: 52,
                                        px: 4,
                                        borderColor: isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(124, 58, 237, 0.3)",
                                        color: isDark ? "#a78bfa" : "#7C3AED",
                                        width: { xs: "100%", sm: "auto" },
                                    }}
                                >
                                    Live Demo
                                </Button>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            style={{ position: "relative" }}
                        >
                            {/* Decorative Background Blob */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: "-10%",
                                    left: "-10%",
                                    width: "120%",
                                    height: "120%",
                                    background: isDark
                                        ? "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(0, 0, 0, 0) 60%)"
                                        : "radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, rgba(0, 0, 0, 0) 60%)",
                                    zIndex: 0,
                                }}
                            />
                            {/* Hero Graphic Card */}
                            <Card
                                sx={{
                                    p: { xs: 2.5, sm: 4 },
                                    zIndex: 1,
                                    position: "relative",
                                    background: isDark ? "rgba(18, 17, 36, 0.65)" : "rgba(255, 255, 255, 0.75)",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 6,
                                }}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#2ecb71" }} />
                                    Active Task Flow
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {[
                                        { title: "Develop backend API services", time: "09:00 - 11:30", cat: "Work", color: "#FF6B6B" },
                                        { title: "Personal fitness & workout", time: "14:30 - 15:30", cat: "Personal", color: "#6C63FF" },
                                        { title: "Weekly review & export metrics", time: "18:00 - 19:00", cat: "Other", color: "#2ECB71" },
                                    ].map((task, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ x: 30, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 + idx * 0.15 }}
                                        >
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 3,
                                                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(124, 58, 237, 0.03)",
                                                    borderLeft: `4px solid ${task.color}`,
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: { xs: "14px", sm: "16px" },
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {task.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                        {task.time}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 2,
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        color: task.color,
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: `rgba(${
                                                            task.color === "#FF6B6B"
                                                                ? "255, 107, 107"
                                                                : task.color === "#6C63FF"
                                                                ? "108, 99, 255"
                                                                : "46, 203, 113"
                                                        }, 0.1)`,
                                                    }}
                                                >
                                                    {task.cat}
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    ))}
                                </Box>

                                {/* AI assistant preview pill */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.1, duration: 0.5 }}
                                >
                                    <Box
                                        sx={{
                                            mt: 3,
                                            p: 1.5,
                                            borderRadius: 3,
                                            background: isDark
                                                ? "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(6,182,212,0.08) 100%)"
                                                : "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(6,182,212,0.04) 100%)",
                                            border: "1px solid",
                                            borderColor: isDark ? "rgba(167,139,250,0.2)" : "rgba(124,58,237,0.12)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <SmartToy sx={{ fontSize: 20, color: "#a78bfa" }} />
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.2 }}>
                                                AI Orchestrator
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "13px" }}>
                                                &ldquo;You have 3 overdue tasks — shall I reschedule them?&rdquo;
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>

            {/* AI Feature Highlight Strip */}
            <Box
                sx={{
                    borderTop: "1px solid",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    py: 2.5,
                    background: isDark
                        ? "rgba(167, 139, 250, 0.04)"
                        : "rgba(124, 58, 237, 0.02)",
                    overflow: "hidden",
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 3, sm: 5 },
                            overflowX: "auto",
                            pb: 0.5,
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.disabled",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                whiteSpace: "nowrap",
                                fontSize: "0.65rem",
                            }}
                        >
                            Powered by Gemini AI
                        </Typography>
                        {AI_HIGHLIGHTS.map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.75,
                                        whiteSpace: "nowrap",
                                        opacity: 0.8,
                                        "&:hover": { opacity: 1 },
                                    }}
                                >
                                    {item.icon}
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                                        {item.label}
                                    </Typography>
                                </Box>
                            </motion.div>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* Features Section — 6-card grid */}
            <Container maxWidth="lg" sx={{ py: 10 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 900,
                            textAlign: "center",
                            mb: 1,
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Everything you need to stay{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, #a78bfa 0%, #2ecb71 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            productive
                        </span>
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ color: "text.secondary", textAlign: "center", mb: 6, maxWidth: 500, mx: "auto" }}
                    >
                        From classic task management to cutting-edge AI agents — built for people who get things done.
                    </Typography>
                </motion.div>

                <Grid container spacing={4}>
                    {FEATURES.map((feat, idx) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.08 }}
                                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                style={{ height: "100%" }}
                            >
                                <Card
                                    sx={{
                                        p: { xs: 3, sm: 4 },
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        position: "relative",
                                        overflow: "hidden",
                                        "&::before": feat.badge
                                            ? {
                                                  content: '""',
                                                  position: "absolute",
                                                  top: 0,
                                                  left: 0,
                                                  right: 0,
                                                  height: "2px",
                                                  background: `linear-gradient(90deg, ${feat.color}, transparent)`,
                                              }
                                            : {},
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 3,
                                                backgroundColor: isDark
                                                    ? "rgba(255, 255, 255, 0.03)"
                                                    : "rgba(124, 58, 237, 0.04)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: "1px solid",
                                                borderColor: isDark
                                                    ? `rgba(${feat.color === "#8B5CF6" ? "139,92,246" : feat.color === "#2ECB71" ? "46,203,113" : feat.color === "#FF6B6B" ? "255,107,107" : feat.color === "#F59E0B" ? "245,158,11" : feat.color === "#06B6D4" ? "6,182,212" : "236,72,153"}, 0.2)`
                                                    : "rgba(0,0,0,0.05)",
                                            }}
                                        >
                                            {feat.icon}
                                        </Box>
                                        {feat.badge && (
                                            <Chip
                                                label={feat.badge}
                                                size="small"
                                                sx={{
                                                    fontSize: "0.65rem",
                                                    fontWeight: 800,
                                                    height: 20,
                                                    background: `rgba(167,139,250,0.15)`,
                                                    color: "#a78bfa",
                                                    border: "1px solid rgba(167,139,250,0.3)",
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {feat.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                                        {feat.desc}
                                    </Typography>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Footer CTA */}
            <Box
                sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                    py: 8,
                    textAlign: "center",
                    background: isDark
                        ? "radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.08) 0%, rgba(0,0,0,0) 70%)"
                        : "radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.04) 0%, rgba(0,0,0,0) 70%)",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: "-0.5px" }}>
                        Ready to take control?
                    </Typography>
                    <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 420, mx: "auto" }}>
                        Join TaskExecutor and let AI handle the heavy lifting while you focus on what matters.
                    </Typography>
                    <Button
                        component={Link}
                        href="/register"
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{ height: 52, px: 5 }}
                    >
                        Create Free Account
                    </Button>
                </motion.div>
            </Box>
        </Box>
    );
}
