"use client";

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogProps,
    DialogTitle,
} from "@mui/material";
import { appDialogPaperSx } from "@/styles/theme-sx";

interface AppDialogProps extends Omit<DialogProps, "title"> {
    title: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function AppDialog({ title, actions, children, ...props }: AppDialogProps) {
    return (
        <Dialog
            {...props}
            slotProps={{
                paper: {
                    sx: appDialogPaperSx,
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, fontSize: "22px", pb: 1 }}>{title}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: "10px !important" }}>
                {children}
            </DialogContent>
            {actions && <DialogActions sx={{ px: 3, pb: 2 }}>{actions}</DialogActions>}
        </Dialog>
    );
}
