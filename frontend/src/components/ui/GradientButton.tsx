"use client";

import { Button, ButtonProps } from "@mui/material";

export function GradientButton({ sx, ...props }: ButtonProps) {
    return (
        <Button
            variant="contained"
            sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": {
                    boxShadow: "0 6px 16px rgba(139, 92, 246, 0.35)",
                },
                ...sx,
            }}
            {...props}
        />
    );
}
