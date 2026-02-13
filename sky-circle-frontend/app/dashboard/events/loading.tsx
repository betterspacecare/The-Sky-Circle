import { Calendar } from 'lucide-react'

export default function EventsLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cosmic-pink/20 border-t-cosmic-pink animate-spin" />
                <Calendar className="w-8 h-8 text-cosmic-pink absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-white/60 font-semibold">Loading Events...</p>
                <p className="text-white/30 text-sm mt-1">Finding celestial gatherings</p>
            </div>
        </div>
    )
}
