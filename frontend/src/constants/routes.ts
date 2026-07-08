export const ROUTES = {
    home: "/",
    welcome: "/welcome",
    login: "/login",
    register: "/register",
    tasks: "/tasks",
    tasksNew: "/tasks/new",
    analytics: "/analytics",
    date: (date: string) => `/date/${date}`,
    taskDetail: (taskId: string) => `/tasks/${taskId}`,
} as const;

export const DASHBOARD_NAV_ITEMS = [
    { text: "Dashboard", path: ROUTES.home },
    { text: "Tasks (Categories)", path: ROUTES.tasks },
    { text: "Analytics & Export", path: ROUTES.analytics },
] as const;
