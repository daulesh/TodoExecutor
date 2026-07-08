"use client";

import React, { useState } from "react";
import {
    Box,
    Drawer,
    IconButton,
    TextField,
    Typography,
    CircularProgress,
    Fab,
} from "@mui/material";
import {
    AutoAwesome as AutoAwesomeIcon,
    Close as CloseIcon,
    Send as SendIcon,
} from "@mui/icons-material";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { sendChat, getApiErrorMessage, isQuotaExceededError } from "@/features/agent/api/agent-api";

const INITIAL_MESSAGE =
    "Hello! I am your AI Orchestrator. Ask me to:\n1. Organize your schedule (optimize target dates)\n2. Plan a project category and set tasks\n3. Analyze productivity streaks and metrics\n\nHow can I help you today?";

export function ChatDrawer() {
    const { resolvedMode } = useThemeMode();
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
        { sender: "ai", text: INITIAL_MESSAGE },
    ]);

    const handleSend = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatInput("");
        setChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
        setChatLoading(true);
        try {
            const response = await sendChat(userMsg);
            setChatHistory((prev) => [...prev, { sender: "ai", text: response }]);
        } catch (err) {
            console.error("Chat error", err);
            const message = isQuotaExceededError(err)
                ? getApiErrorMessage(err, "Monthly AI token quota exceeded.")
                : "Sorry, I encountered an issue connecting to the AI agent service. Please try again.";
            setChatHistory((prev) => [...prev, { sender: "ai", text: message }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <>
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
                    },
                }}
            >
                <AutoAwesomeIcon />
            </Fab>

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
                            height: "100%",
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        p: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
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
                                        : resolvedMode === "dark"
                                          ? "rgba(255,255,255,0.02)"
                                          : "rgba(124,58,237,0.04)",
                                    color: isUser ? "primary.contrastText" : "text.primary",
                                    border: isUser ? "none" : "1px solid",
                                    borderColor: isUser
                                        ? "none"
                                        : resolvedMode === "dark"
                                          ? "rgba(255,255,255,0.05)"
                                          : "rgba(124,58,237,0.08)",
                                }}
                            >
                                <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.5, fontSize: "13.5px" }}>
                                    {msg.text}
                                </Typography>
                            </Box>
                        );
                    })}
                    {chatLoading && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                p: 1.5,
                                alignSelf: "flex-start",
                                borderRadius: 3,
                                backgroundColor:
                                    resolvedMode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.04)",
                            }}
                        >
                            <CircularProgress size={16} color="primary" />
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                Agent thinking...
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Box
                    sx={{
                        p: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        gap: 1,
                        backgroundColor: "background.paper",
                    }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Ask anything..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !chatLoading && chatInput.trim()) handleSend();
                        }}
                        disabled={chatLoading}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={chatLoading || !chatInput.trim()}
                        sx={{
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                            color: "white",
                            borderRadius: 3,
                            "&:hover": { background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" },
                            "&.Mui-disabled": { background: "rgba(0, 0, 0, 0.05)", color: "rgba(0, 0, 0, 0.25)" },
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Drawer>
        </>
    );
}
