'use client'

import { useToastStore, ToastType } from '@/store/toastStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

/**
 * ToastContainer Component
 * Displays toast notifications for user feedback
 * 
 * Validates: Requirements 3.1, 3.2 (error handling for follow/unfollow actions)
 */

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
}

const TOAST_STYLES: Record<ToastType, string> = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore()

    if (toasts.length === 0) return null

    return (
        <div 
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        glass border backdrop-blur-md
                        animate-slide-in-right
                        ${TOAST_STYLES[toast.type]}
                    `}
                    role="alert"
                    aria-live="polite"
                >
                    {TOAST_ICONS[toast.type]}
                    <span className="flex-1 text-sm text-white/90">
                        {toast.message}
                    </span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>
            ))}
        </div>
    )
}
