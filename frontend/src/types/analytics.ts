export interface CategoryBreakdown {
    category_id?: string;
    category_name: string;
    total: number;
    completed: number;
}

export interface MostRescheduledTask {
    task_id: string;
    title: string;
    reschedule_count: number;
}

export interface AnalyticsData {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    completion_rate: number;
    overdue_tasks: number;
    tasks_by_category: CategoryBreakdown[];
    date_change_count: number;
    most_rescheduled_task?: MostRescheduledTask;
}
