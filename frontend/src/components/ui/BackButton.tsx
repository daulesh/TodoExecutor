"use client";

import Link from "next/link";
import { IconButton, IconButtonProps } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { ghostIconButtonSx } from "@/styles/theme-sx";

interface BackButtonProps extends Omit<IconButtonProps, "children"> {
    href?: string;
}

export function BackButton({ href, onClick, sx, ...props }: BackButtonProps) {
    const buttonSx = { ...ghostIconButtonSx, ...sx };

    if (href) {
        return (
            <IconButton component={Link} href={href} sx={buttonSx} {...props}>
                <ArrowBack />
            </IconButton>
        );
    }

    return (
        <IconButton onClick={onClick} sx={buttonSx} {...props}>
            <ArrowBack />
        </IconButton>
    );
}
