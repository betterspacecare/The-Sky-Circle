import { Telescope } from 'lucide-react'

export default function ObservationsLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-cosmic-blue/20 border-t-cosmic-blue animate-spin" />
                <Telescope className="w-8 h-8 text-cosmic-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
                <p className="text-white/60 font-semibold">Loading Observations...</p>
                <p className="text-white/30 text-sm mt-1">Scanning the cosmos</p>
            </div>
        </div>
    )
}
