export interface Category {
    id: string;
    title: string;
    color_hex: string;
    icon?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    target_date: string;
    start_time?: string;
    end_time?: string;
    is_completed: boolean;
    category_id?: string;
    category?: Category;
}

export interface ChangeLog {
    id: string;
    reason: string;
    original_target_date: string;
    new_target_date: string;
    changed_at: string;
}

export interface TaskDetail {
    id: string;
    title: string;
    description?: string;
    target_date: string;
    start_time?: string;
    end_time?: string;
    estimated_duration_minutes?: number;
    category_id?: string;
    change_history: ChangeLog[];
}
