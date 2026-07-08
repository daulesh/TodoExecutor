import { Box, CircularProgress } from "@mui/material";

interface LoadingCenterProps {
    py?: number;
}

export function LoadingCenter({ py = 8 }: LoadingCenterProps) {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", py }}>
            <CircularProgress color="primary" />
        </Box>
    );
}
