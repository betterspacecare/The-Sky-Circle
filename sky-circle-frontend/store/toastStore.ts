import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastStore {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
    clearToasts: () => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = `toast-${++toastId}`
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }))
        // Auto-remove after duration (default 3 seconds)
        const duration = toast.duration ?? 3000
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }))
        }, duration)
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    clearToasts: () => set({ toasts: [] }),
}))

// Helper functions for common toast types
export const toast = {
    success: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) =>
        useToastStore.getState().addToast({ message, type: 'info', duration }),
}
