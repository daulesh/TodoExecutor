export const ghostIconButtonSx = {
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
} as const;

export const gradientPrimaryButtonSx = {
    borderRadius: 3,
    py: 1.2,
    px: 3,
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
    background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    textTransform: "none",
    height: "fit-content",
    "&:hover": {
        background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
        boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
    },
} as const;

export const appDialogPaperSx = {
    backgroundColor: "background.paper",
    backgroundImage: "none",
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "20px",
    p: 1.5,
} as const;
