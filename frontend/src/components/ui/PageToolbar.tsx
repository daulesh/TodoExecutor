import { Box, Typography } from "@mui/material";
import { BackButton } from "./BackButton";

interface PageToolbarProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    backHref?: string;
}

export function PageToolbar({ title, subtitle, onBack, backHref }: PageToolbarProps) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BackButton onClick={onBack} href={backHref} />
            <Box sx={{ overflow: "hidden" }}>
                {subtitle && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: "#8B5CF6",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontSize: { xs: "11px", sm: "13px" },
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 800,
                        mt: subtitle ? 0.5 : 0,
                        letterSpacing: "-1px",
                        fontSize: { xs: "1.75rem", sm: "2.125rem" },
                    }}
                >
                    {title}
                </Typography>
            </Box>
        </Box>
    );
}
