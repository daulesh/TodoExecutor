/**
 * Layout wrapper for authenticated dashboard pages in TaskExecutor.
 * Sets up the main persistent navigation sidebar, responsive mobile drawer, theme mode toggling, and floating AI chat drawer interface.
 */
"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/fetcher";
import { useAuth, useThemeMode } from "@/components/providers/Providers";
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
    CircularProgress,
    Tooltip,
    Fab,
    TextField,
} from "@mui/material";
import { 
    Dashboard as DashboardIcon, 
    ListAlt as ListIcon, 
    BarChart as AnalyticsIcon, 
    Logout as LogoutIcon,
    Menu as MenuIcon,
    DarkMode,
    LightMode,
    SettingsBrightness,
    AutoAwesome as AutoAwesomeIcon,
    Close as CloseIcon,
    Send as SendIcon
} from "@mui/icons-material";

const DRAWER_WIDTH = 300;

/**
 * Serves as the primary layout shell for dashboard pages, providing navigation and global actions for authenticated users.
 * Renders the sidebar navigation, top bar, floating AI assistant drawer, theme mode switcher, and user session details.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { themeMode, setThemeMode, resolvedMode } = useThemeMode();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // AI Chatbot States
    const [chatOpen, setChatOpen] = React.useState(false);
    const [chatInput, setChatInput] = React.useState("");
    const [chatLoading, setChatLoading] = React.useState(false);
    const [chatHistory, setChatHistory] = React.useState<Array<{ sender: "user" | "ai"; text: string }>>([
        { sender: "ai", text: "Hello! I am your AI Orchestrator. Ask me to:\n1. Organize your schedule (optimize target dates)\n2. Plan a project category and set tasks\n3. Analyze productivity streaks and metrics\n\nHow can I help you today?" }
    ]);

    const sendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatInput("");
        setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
        setChatLoading(true);
        try {
            const res = await api.post("/agent/chat", { message: userMsg });
            setChatHistory(prev => [...prev, { sender: "ai", text: res.response }]);
        } catch (err) {
            console.error("Chat error", err);
            setChatHistory(prev => [...prev, { sender: "ai", text: "Sorry, I encountered an issue connecting to the AI agent service. Please try again." }]);
        } finally {
            setChatLoading(false);
        }
    };

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
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const navigationItems = [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
        { text: "Tasks (Categories)", icon: <ListIcon />, path: "/tasks" },
        { text: "Analytics & Export", icon: <AnalyticsIcon />, path: "/analytics" },
    ];

    const drawerContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "background.paper" }}>
            {/* Logo area */}
            <Toolbar sx={{ px: 3, display: "flex", gap: 1.5 }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontWeight: 900, 
                        background: "linear-gradient(135deg, #a78bfa 0%, #2ecb71 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.5px"
                    }}
                >
                    TaskExecutor
                </Typography>
            </Toolbar>
            <Divider sx={{ opacity: 0.1 }} />
            
            {/* Nav list */}
            <List sx={{ px: 2, py: 3, flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                {navigationItems.map((item) => {
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
                                        "&:hover": {
                                            backgroundColor: "action.hover",
                                            color: "text.primary",
                                        },
                                        "&.Mui-selected": {
                                            backgroundColor: "action.selected",
                                            color: "primary.main",
                                            "&:hover": {
                                                backgroundColor: "action.hover",
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: active ? "primary.main" : "text.secondary", minWidth: 40 }}>
                                        {item.icon}
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

            {/* Theme switcher */}
            <Box sx={{ px: 3, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Appearance
                </Typography>
                <Box sx={{
                    display: "flex",
                    backgroundColor: resolvedMode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.05)",
                    borderRadius: 3,
                    p: 0.5,
                    border: "1px solid",
                    borderColor: resolvedMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(124, 58, 237, 0.1)",
                }}>
                    {[
                        { mode: "light", icon: <LightMode sx={{ fontSize: 18 }} />, label: "Light" },
                        { mode: "dark", icon: <DarkMode sx={{ fontSize: 18 }} />, label: "Dark" },
                        { mode: "system", icon: <SettingsBrightness sx={{ fontSize: 18 }} />, label: "System" }
                    ].map((item) => {
                        const active = themeMode === item.mode;
                        return (
                            <Tooltip title={`${item.label} Mode`} key={item.mode}>
                                <IconButton
                                    size="small"
                                    onClick={() => setThemeMode(item.mode as any)}
                                    sx={{
                                        flexGrow: 1,
                                        borderRadius: 2.5,
                                        py: 1,
                                        color: active ? "primary.main" : "text.secondary",
                                        backgroundColor: active ? "rgba(139, 92, 246, 0.1)" : "transparent",
                                        "&:hover": {
                                            backgroundColor: active
                                                ? "rgba(139, 92, 246, 0.15)"
                                                : resolvedMode === "dark"
                                                  ? "rgba(255,255,255,0.02)"
                                                  : "rgba(124, 58, 237, 0.06)",
                                        }
                                    }}
                                >
                                    {item.icon}
                                </IconButton>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            <Divider sx={{ opacity: 0.1 }} />

            {/* Profile & Logout */}
            <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar 
                        src={user?.avatar_url} 
                        sx={{ 
                            width: 40, 
                            height: 40, 
                            border: "2px solid #8B5CF6",
                            backgroundColor: "#8B5CF6",
                            color: "#fff"
                        }}
                    >
                        {user?.username.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box sx={{ maxWidth: 120 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "text.primary", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {user?.username}
                        </Typography>
                        <Typography variant="caption" noWrap sx={{ color: "text.secondary", textOverflow: "ellipsis", overflow: "hidden" }}>
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
                <Tooltip title="Log Out">
                    <IconButton 
                        onClick={logout} 
                        sx={{ 
                            color: "text.secondary",
                            "&:hover": { 
                                color: "#FF6B6B", 
                                backgroundColor: "rgba(255, 107, 107, 0.1)" 
                            } 
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
            {/* Topbar for mobile view */}
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
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2 }}
                    >
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

            {/* Navigation drawers */}
            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
                aria-label="mailbox folders"
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Desktop persistent drawer */}
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

            {/* Core page layout content */}
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

            {/* Floating AI Chat Assistant Button - sits at the bottom right */}
            <Fab 
                color="primary"
                aria-label="chat"
                onClick={() => setChatOpen(true)}
                sx={{ 
                    position: "fixed", 
                    bottom: { xs: 16, sm: 32 },
                    right: { xs: 16, sm: 32 },
                    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                    boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
                    color: "white",
                    "&:hover": {
                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                        boxShadow: "0 12px 28px rgba(139, 92, 246, 0.55)",
                    }
                }}
            >
                <AutoAwesomeIcon />
            </Fab>

            {/* AI Assistant Chat Drawer */}
            <Drawer
                anchor="right"
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: "100%", sm: 400 },
                            borderLeft: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            backgroundImage: "none",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%"
                        }
                    }
                }}
            >
                {/* Chat Drawer Header */}
                <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AutoAwesomeIcon sx={{ color: "white", fontSize: 16 }} />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                AI Assistant
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Orchestrated Multi-Agent
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setChatOpen(false)} sx={{ color: "text.secondary" }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Chat Message Window */}
                <Box sx={{ flexGrow: 1, p: 2.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                    {chatHistory.map((msg, idx) => {
                        const isUser = msg.sender === "user";
                        return (
                            <Box 
                                key={idx} 
                                sx={{ 
                                    alignSelf: isUser ? "flex-end" : "flex-start",
                                    maxWidth: "85%",
                                    p: 1.5,
                                    borderRadius: 3,
                                    backgroundColor: isUser 
                                        ? "primary.main" 
                                        : (resolvedMode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.04)"),
                                    color: isUser ? "primary.contrastText" : "text.primary",
                                    border: isUser ? "none" : "1px solid",
                                    borderColor: isUser ? "none" : (resolvedMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.08)"),
                                }}
                            >
                                <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.5, fontSize: "13.5px" }}>
                                    {msg.text}
                                </Typography>
                            </Box>
                        );
                    })}
                    {chatLoading && (
                        <Box sx={{ display: "flex", gap: 1, p: 1.5, alignSelf: "flex-start", borderRadius: 3, backgroundColor: resolvedMode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.04)" }}>
                            <CircularProgress size={16} color="primary" />
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Agent thinking...
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Input window */}
                <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", gap: 1, backgroundColor: "background.paper" }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Ask anything..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !chatLoading && chatInput.trim()) { sendMessage(); } }}
                        disabled={chatLoading}
                        sx={{ 
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3
                            }
                        }}
                    />
                    <IconButton 
                        color="primary" 
                        onClick={sendMessage}
                        disabled={chatLoading || !chatInput.trim()}
                        sx={{ 
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                            color: "white",
                            borderRadius: 3,
                            "&:hover": {
                                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
                            },
                            "&.Mui-disabled": {
                                background: "rgba(0, 0, 0, 0.05)",
                                color: "rgba(0, 0, 0, 0.25)"
                            }
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Drawer>
        </Box>
    );
}
