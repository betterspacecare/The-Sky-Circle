'use client'

import { Loader2, Sparkles } from 'lucide-react'

interface LoadingSpinnerProps {
    message?: string
    size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="relative">
                <Loader2 className={`${sizeClasses[size]} text-cosmic-purple animate-spin`} />
                <div className="absolute inset-0 blur-xl bg-cosmic-purple/30 animate-pulse" />
            </div>
            <p className="text-white/50 font-medium animate-pulse">{message}</p>
        </div>
    )
}

export function PageLoader({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cosmic-purple/20 border-t-cosmic-purple animate-spin" />
                <Sparkles className="w-8 h-8 text-cosmic-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-white/60 font-semibold">{message || 'Loading...'}</p>
                <p className="text-white/30 text-sm mt-1">Preparing your cosmic experience</p>
            </div>
        </div>
    )
}
