import { Alert, AlertProps } from "@mui/material";

export function ErrorAlert({ sx, ...props }: AlertProps) {
    return (
        <Alert
            severity="error"
            sx={{
                borderRadius: 3,
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                ...sx,
            }}
            {...props}
        />
    );
}
