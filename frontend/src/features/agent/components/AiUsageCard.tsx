"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    LinearProgress,
    Typography,
    Tooltip,
    IconButton,
    CircularProgress,
} from "@mui/material";
import { AutoAwesome as AutoAwesomeIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import {
    AgentUsageSummary,
    getAgentUsage,
    LLM_USAGE_UPDATED_EVENT,
} from "@/features/agent/api/agent-api";

function formatTokenCount(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
}

export function AiUsageCard() {
    const [usage, setUsage] = useState<AgentUsageSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUsage = useCallback(async () => {
        setError(null);
        try {
            const data = await getAgentUsage();
            setUsage(data);
        } catch {
            setError("Unable to load AI usage");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsage();
    }, [loadUsage]);

    useEffect(() => {
        const handleUsageUpdated = () => {
            loadUsage();
        };
        window.addEventListener(LLM_USAGE_UPDATED_EVENT, handleUsageUpdated);
        return () => window.removeEventListener(LLM_USAGE_UPDATED_EVENT, handleUsageUpdated);
    }, [loadUsage]);

    if (loading) {
        return (
            <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    if (error || !usage) {
        return null;
    }

    const quotaLabel = usage.quota_enabled && usage.monthly_quota
        ? `${formatTokenCount(usage.tokens_used_this_month)} / ${formatTokenCount(usage.monthly_quota)}`
        : `${formatTokenCount(usage.tokens_used_this_month)} used this month`;

    const progressValue = usage.quota_enabled && usage.percent_used != null
        ? usage.percent_used
        : 0;

    const isNearLimit = usage.quota_enabled && (usage.percent_used ?? 0) >= 85;
    const isOverLimit = usage.quota_enabled && (usage.tokens_remaining ?? 1) <= 0;

    return (
        <Box
            sx={{
                mx: 2,
                mb: 2,
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: isOverLimit ? "error.main" : "divider",
                backgroundColor: "action.hover",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                        AI Usage
                    </Typography>
                </Box>
                <Tooltip title="Refresh usage">
                    <IconButton size="small" onClick={loadUsage} aria-label="Refresh AI usage">
                        <RefreshIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {quotaLabel} tokens
            </Typography>

            {usage.quota_enabled ? (
                <>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(progressValue, 100)}
                        color={isOverLimit ? "error" : isNearLimit ? "warning" : "primary"}
                        sx={{ height: 6, borderRadius: 3, mb: 0.75 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {isOverLimit
                            ? "Monthly quota reached — AI features paused until next month"
                            : `${formatTokenCount(usage.tokens_remaining ?? 0)} remaining · ${usage.model}`}
                    </Typography>
                </>
            ) : (
                <Typography variant="caption" color="text.secondary">
                    Unlimited quota · {usage.model}
                </Typography>
            )}
        </Box>
    );
}
