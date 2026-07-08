"use client";

import { Chip, ChipProps } from "@mui/material";

interface CategoryChipProps extends Omit<ChipProps, "label"> {
    label: string;
    colorHex?: string;
    selected?: boolean;
}

export function CategoryChip({ label, colorHex, selected, sx, ...props }: CategoryChipProps) {
    return (
        <Chip
            label={label}
            clickable
            sx={{
                px: 1,
                py: 2.2,
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "12px",
                ...(colorHex && { borderLeft: `4px solid ${colorHex}` }),
                backgroundColor: selected ? "rgba(139, 92, 246, 0.15)" : "rgba(124, 58, 237, 0.03)",
                color: selected ? "primary.main" : "text.primary",
                borderColor: selected ? "primary.main" : "divider",
                ...sx,
            }}
            {...props}
        />
    );
}
