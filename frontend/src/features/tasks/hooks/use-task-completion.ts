"use client";

import { useState, useCallback } from "react";
import type { Task } from "@/types";
import { completeTask } from "@/features/tasks/api/tasks-api";

interface UseTaskCompletionOptions {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export function useTaskCompletion({ tasks, setTasks }: UseTaskCompletionOptions) {
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
    const [actualDuration, setActualDuration] = useState("");
    const [completionNotes, setCompletionNotes] = useState("");

    const toggleTaskCompletion = useCallback(
        async (taskId: string, isCompleted: boolean, duration = actualDuration, notes = completionNotes) => {
            try {
                const body = {
                    is_completed: isCompleted,
                    actual_duration_minutes: isCompleted && duration ? parseInt(duration) : null,
                    completion_notes: isCompleted && notes ? notes : null,
                };
                const updatedTask = await completeTask(taskId, body);
                setTasks((prev) =>
                    prev.map((t) => (t.id === taskId ? { ...t, is_completed: updatedTask.is_completed } : t))
                );
            } catch (err) {
                console.error("Failed to update completion", err);
            }
        },
        [actualDuration, completionNotes, setTasks]
    );

    const handleCheckboxToggle = (taskId: string, isCompleted: boolean) => {
        if (isCompleted) {
            setTaskToComplete(taskId);
            setActualDuration("");
            setCompletionNotes("");
            setCompleteModalOpen(true);
        } else {
            toggleTaskCompletion(taskId, false, "", "");
        }
    };

    const confirmCompletion = () => {
        if (taskToComplete) {
            toggleTaskCompletion(taskToComplete, true);
            setCompleteModalOpen(false);
            setTaskToComplete(null);
        }
    };

    const closeModal = () => setCompleteModalOpen(false);

    return {
        completeModalOpen,
        actualDuration,
        completionNotes,
        setActualDuration,
        setCompletionNotes,
        handleCheckboxToggle,
        confirmCompletion,
        closeModal,
    };
}
