import { Box, Card, Typography } from "@mui/material";

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    caption?: string;
    valueColor?: string;
}

export function StatCard({ icon, label, value, caption, valueColor }: StatCardProps) {
    return (
        <Card
            sx={{
                p: { xs: 2, sm: 3 },
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, sm: 3 },
                minHeight: { xs: 110, sm: 140 },
                height: "100%",
            }}
        >
            {icon}
            <Box sx={{ overflow: "hidden", minWidth: 0, width: "100%" }}>
                <Typography variant="subtitle2" sx={{ color: "#9CA3AF", fontWeight: 600 }}>
                    {label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: valueColor ?? "text.primary" }}>
                    {value}
                </Typography>
                {caption && (
                    <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                        {caption}
                    </Typography>
                )}
            </Box>
        </Card>
    );
}
