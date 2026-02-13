import { Bell } from 'lucide-react'

export default function AlertsLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Bell className="w-8 h-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-white/60 font-semibold">Loading Alerts...</p>
                <p className="text-white/30 text-sm mt-1">Checking for sky events</p>
            </div>
        </div>
    )
}
