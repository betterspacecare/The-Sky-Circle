'use client'

import { useState } from 'react'
import { UserGear, GearType } from '@/types/social.types'
import { createGear, updateGear, deleteGear } from '@/lib/services/gearService'
import GearForm from './GearForm'
import { 
    Plus, 
    Pencil, 
    Trash2, 
    Telescope, 
    Camera, 
    CircleDot, 
    Eye, 
    Filter, 
    Wrench,
    Loader2
} from 'lucide-react'

/**
 * GearsList Component
 * Displays a list of user's astronomy equipment with CRUD operations
 * 
 * Validates: Requirements 1.1, 1.6
 */

interface GearsListProps {
    userId: string;
    isOwnProfile: boolean;
    gears: UserGear[];
    onGearAdded?: (gear: UserGear) => void;
    onGearUpdated?: (gear: UserGear) => void;
    onGearDeleted?: (gearId: string) => void;
}

const GEAR_TYPE_ICONS: Record<GearType, React.ReactNode> = {
    telescope: <Telescope className="w-4 h-4" />,
    camera: <Camera className="w-4 h-4" />,
    mount: <CircleDot className="w-4 h-4" />,
    eyepiece: <Eye className="w-4 h-4" />,
    filter: <Filter className="w-4 h-4" />,
    accessory: <Wrench className="w-4 h-4" />,
}

const GEAR_TYPE_LABELS: Record<GearType, string> = {
    telescope: 'Telescope',
    camera: 'Camera',
    mount: 'Mount',
    eyepiece: 'Eyepiece',
    filter: 'Filter',
    accessory: 'Accessory',
}

export default function GearsList({
    userId,
    isOwnProfile,
    gears,
    onGearAdded,
    onGearUpdated,
    onGearDeleted,
}: GearsListProps) {
    const [showForm, setShowForm] = useState(false)
    const [editingGear, setEditingGear] = useState<UserGear | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleAddGear = async (data: Omit<UserGear, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        const result = await createGear(userId, data)
        if (result.error) {
            throw new Error(result.error)
        }
        if (result.data) {
            onGearAdded?.(result.data)
            setShowForm(false)
        }
    }

    const handleUpdateGear = async (data: Omit<UserGear, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (!editingGear) return
        
        const result = await updateGear(editingGear.id, data)
        if (result.error) {
            throw new Error(result.error)
        }
        if (result.data) {
            onGearUpdated?.(result.data)
            setEditingGear(null)
        }
    }

    const handleDeleteGear = async (gearId: string) => {
        setDeletingId(gearId)
        try {
            const result = await deleteGear(gearId)
            if (result.error) {
                console.error('Error deleting gear:', result.error)
                return
            }
            onGearDeleted?.(gearId)
        } finally {
            setDeletingId(null)
        }
    }

    // Show form for adding new gear
    if (showForm) {
        return (
            <GearForm
                onSubmit={handleAddGear}
                onCancel={() => setShowForm(false)}
            />
        )
    }

    // Show form for editing existing gear
    if (editingGear) {
        return (
            <GearForm
                gear={editingGear}
                onSubmit={handleUpdateGear}
                onCancel={() => setEditingGear(null)}
            />
        )
    }

    return (
        <div className="glass-effect rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Telescope className="w-5 h-5 text-cosmic-purple" />
                    Equipment
                    <span className="text-xs font-normal text-white/40">({gears.length})</span>
                </h3>
                
                {/* Show add button only for own profile */}
                {isOwnProfile && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="p-2 bg-cosmic-purple/20 text-cosmic-purple rounded-lg hover:bg-cosmic-purple/30 transition-all"
                        aria-label="Add gear"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {gears.length === 0 ? (
                <div className="text-center py-8">
                    <Telescope className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/40">
                        {isOwnProfile 
                            ? "No equipment added yet. Add your first gear!"
                            : "No equipment listed."
                        }
                    </p>
                    {isOwnProfile && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-lg text-sm font-medium hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
                        >
                            Add Your First Gear
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {gears.map((gear) => (
                        <div
                            key={gear.id}
                            className="glass-inner rounded-xl p-4 flex items-start gap-3 group"
                        >
                            {/* Gear type icon */}
                            <div className="w-10 h-10 rounded-lg bg-cosmic-purple/20 flex items-center justify-center text-cosmic-purple shrink-0">
                                {GEAR_TYPE_ICONS[gear.gear_type]}
                            </div>

                            {/* Gear details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm truncate">{gear.name}</h4>
                                        <p className="text-xs text-cosmic-purple">
                                            {GEAR_TYPE_LABELS[gear.gear_type]}
                                        </p>
                                    </div>
                                    
                                    {/* Edit/Delete actions for own profile */}
                                    {isOwnProfile && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => setEditingGear(gear)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                                aria-label={`Edit ${gear.name}`}
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-white/60" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGear(gear.id)}
                                                disabled={deletingId === gear.id}
                                                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                aria-label={`Delete ${gear.name}`}
                                            >
                                                {deletingId === gear.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 text-white/60 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Brand and model */}
                                {(gear.brand || gear.model) && (
                                    <p className="text-xs text-white/50 mt-1 truncate">
                                        {[gear.brand, gear.model].filter(Boolean).join(' • ')}
                                    </p>
                                )}

                                {/* Notes */}
                                {gear.notes && (
                                    <p className="text-xs text-white/40 mt-2 line-clamp-2">
                                        {gear.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
