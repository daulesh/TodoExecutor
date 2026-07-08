"use client";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { DarkMode, LightMode, SettingsBrightness } from "@mui/icons-material";
import { useThemeMode } from "@/components/providers/ThemeProvider";

export function ThemeModeSwitcher() {
    const { themeMode, setThemeMode, resolvedMode } = useThemeMode();

    return (
        <Box sx={{ px: 3, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
            >
                Appearance
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    backgroundColor: resolvedMode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(124, 58, 237, 0.05)",
                    borderRadius: 3,
                    p: 0.5,
                    border: "1px solid",
                    borderColor: resolvedMode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(124, 58, 237, 0.1)",
                }}
            >
                {[
                    { mode: "light" as const, icon: <LightMode sx={{ fontSize: 18 }} />, label: "Light" },
                    { mode: "dark" as const, icon: <DarkMode sx={{ fontSize: 18 }} />, label: "Dark" },
                    { mode: "system" as const, icon: <SettingsBrightness sx={{ fontSize: 18 }} />, label: "System" },
                ].map((item) => {
                    const active = themeMode === item.mode;
                    return (
                        <Tooltip title={`${item.label} Mode`} key={item.mode}>
                            <IconButton
                                size="small"
                                onClick={() => setThemeMode(item.mode)}
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
                                    },
                                }}
                            >
                                {item.icon}
                            </IconButton>
                        </Tooltip>
                    );
                })}
            </Box>
        </Box>
    );
}
