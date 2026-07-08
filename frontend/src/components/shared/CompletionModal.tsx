"use client";

import { Button, TextField, Typography } from "@mui/material";
import { AppDialog } from "@/components/ui";

interface CompletionModalProps {
    open: boolean;
    actualDuration: string;
    completionNotes: string;
    onActualDurationChange: (value: string) => void;
    onCompletionNotesChange: (value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export function CompletionModal({
    open,
    actualDuration,
    completionNotes,
    onActualDurationChange,
    onCompletionNotesChange,
    onClose,
    onConfirm,
}: CompletionModalProps) {
    return (
        <AppDialog
            open={open}
            onClose={onClose}
            title="Mark Task Complete"
            actions={
                <>
                    <Button onClick={onClose} sx={{ color: "text.secondary" }}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} variant="contained" color="secondary">
                        Confirm Complete
                    </Button>
                </>
            }
        >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Optional: record your completion logs and time spent to populate productivity metrics.
            </Typography>
            <TextField
                label="Actual Duration (minutes)"
                type="number"
                placeholder="e.g. 45"
                fullWidth
                value={actualDuration}
                onChange={(e) => onActualDurationChange(e.target.value)}
            />
            <TextField
                label="Completion Notes"
                placeholder="What went well? Any follow ups?"
                multiline
                rows={3}
                fullWidth
                value={completionNotes}
                onChange={(e) => onCompletionNotesChange(e.target.value)}
            />
        </AppDialog>
    );
}
