import { Loader2, Rocket } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cosmic-purple/20 border-t-cosmic-purple animate-spin" />
                <Rocket className="w-8 h-8 text-cosmic-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-white/60 font-semibold">Loading Dashboard...</p>
                <p className="text-white/30 text-sm mt-1">Preparing mission control</p>
            </div>
        </div>
    )
}
