import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
    title: string;
    description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <Box>
            <Typography
                variant="h3"
                sx={{
                    fontWeight: 900,
                    mb: 1,
                    letterSpacing: "-1.5px",
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                }}
            >
                {title}
            </Typography>
            {description && (
                <Typography
                    variant="subtitle1"
                    sx={{ color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" }, mb: description ? 0 : 2 }}
                >
                    {description}
                </Typography>
            )}
        </Box>
    );
}
