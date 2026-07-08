"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { DASHBOARD_NAV_ITEMS } from "@/constants/routes";
import { LoadingCenter } from "@/components/ui";
import { ThemeModeSwitcher } from "@/components/layout/ThemeModeSwitcher";
import { ChatDrawer } from "@/features/agent/components/ChatDrawer";
import { AiUsageCard } from "@/features/agent/components/AiUsageCard";
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Tooltip,
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    ListAlt as ListIcon,
    BarChart as AnalyticsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
} from "@mui/icons-material";

const DRAWER_WIDTH = 300;

const NAV_ICONS: Record<string, React.ReactNode> = {
    "/": <DashboardIcon />,
    "/tasks": <ListIcon />,
    "/analytics": <AnalyticsIcon />,
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { resolvedMode } = useThemeMode();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            router.push("/welcome");
        }
    }, [isLoading, isAuthenticated, router, mounted]);

    if (!mounted || isLoading || !isAuthenticated) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.default" }}>
                <LoadingCenter py={0} />
            </Box>
        );
    }

    const drawerContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "background.paper" }}>
            <Toolbar sx={{ px: 3, display: "flex", gap: 1.5 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #a78bfa 0%, #2ecb71 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.5px",
                    }}
                >
                    TaskExecutor
                </Typography>
            </Toolbar>
            <Divider sx={{ opacity: 0.1 }} />

            <List sx={{ px: 2, py: 3, flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                {DASHBOARD_NAV_ITEMS.map((item) => {
                    const active = pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding>
                            <Link
                                href={item.path}
                                style={{ textDecoration: "none", width: "100%", color: "inherit" }}
                                onClick={() => setMobileOpen(false)}
                            >
                                <ListItemButton
                                    selected={active}
                                    sx={{
                                        borderRadius: 3,
                                        py: 1.5,
                                        px: 2,
                                        color: active ? "primary.main" : "text.secondary",
                                        backgroundColor: active ? "action.selected" : "transparent",
                                        transition: "all 0.2s",
                                        "&:hover": { backgroundColor: "action.hover", color: "text.primary" },
                                        "&.Mui-selected": {
                                            backgroundColor: "action.selected",
                                            color: "primary.main",
                                            "&:hover": { backgroundColor: "action.hover" },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: active ? "primary.main" : "text.secondary", minWidth: 40 }}>
                                        {NAV_ICONS[item.path]}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        slotProps={{ primary: { sx: { fontWeight: active ? 700 : 500 } } }}
                                    />
                                </ListItemButton>
                            </Link>
                        </ListItem>
                    );
                })}
            </List>

            <ThemeModeSwitcher />
            <AiUsageCard />
            <Divider sx={{ opacity: 0.1 }} />

            <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                        src={user?.avatar_url}
                        sx={{ width: 40, height: 40, border: "2px solid #8B5CF6", backgroundColor: "#8B5CF6", color: "#fff" }}
                    >
                        {user?.username.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box sx={{ maxWidth: 120 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "text.primary" }}>
                            {user?.username}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
                <Tooltip title="Log Out">
                    <IconButton
                        onClick={logout}
                        sx={{
                            color: "text.secondary",
                            "&:hover": { color: "#FF6B6B", backgroundColor: "rgba(255, 107, 107, 0.1)" },
                        }}
                    >
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    display: { md: "none" },
                    background: resolvedMode === "dark" ? "rgba(10, 9, 21, 0.8)" : "rgba(249, 250, 251, 0.8)",
                    backdropFilter: "blur(12px)",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    boxShadow: "none",
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#8B5CF6" }}>
                        TaskExecutor
                    </Typography>
                    <Avatar src={user?.avatar_url} sx={{ width: 32, height: 32 }}>
                        {user?.username.slice(0, 1).toUpperCase()}
                    </Avatar>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH } }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: DRAWER_WIDTH,
                            borderRight: "1px solid",
                            borderColor: "divider",
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3, md: 5 },
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: { xs: 8, md: 0 },
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                }}
            >
                {children}
            </Box>

            <ChatDrawer />
        </Box>
    );
}
