'use client'

import { useState, FormEvent } from 'react'
import { UserGear, GearType } from '@/types/social.types'
import { VALID_GEAR_TYPES } from '@/lib/services/gearService'
import { Loader2, X } from 'lucide-react'

/**
 * GearForm Component
 * Form for creating and editing user gear items
 * 
 * Validates: Requirements 1.2, 1.3, 1.5
 */

interface GearFormProps {
    gear?: UserGear;  // undefined for new gear
    onSubmit: (data: Omit<UserGear, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
    onCancel: () => void;
}

interface FormErrors {
    name?: string;
    gear_type?: string;
}

const GEAR_TYPE_LABELS: Record<GearType, string> = {
    telescope: 'Telescope',
    camera: 'Camera',
    mount: 'Mount',
    eyepiece: 'Eyepiece',
    filter: 'Filter',
    accessory: 'Accessory',
}

export default function GearForm({ gear, onSubmit, onCancel }: GearFormProps) {
    const isEditMode = !!gear
    
    const [formData, setFormData] = useState({
        name: gear?.name || '',
        gear_type: gear?.gear_type || '' as GearType | '',
        brand: gear?.brand || '',
        model: gear?.model || '',
        notes: gear?.notes || '',
    })
    
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitting, setSubmitting] = useState(false)

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}
        
        // Validate required name field
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }
        
        // Validate gear_type is selected and valid
        if (!formData.gear_type) {
            newErrors.gear_type = 'Gear type is required'
        } else if (!VALID_GEAR_TYPES.includes(formData.gear_type as GearType)) {
            newErrors.gear_type = 'Invalid gear type selected'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }
        
        setSubmitting(true)
        try {
            await onSubmit({
                name: formData.name.trim(),
                gear_type: formData.gear_type as GearType,
                brand: formData.brand.trim() || null,
                model: formData.model.trim() || null,
                notes: formData.notes.trim() || null,
            })
        } catch (error) {
            // Error handling is done by parent component
            console.error('Error submitting gear form:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass-effect rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">
                    {isEditMode ? 'Edit Gear' : 'Add New Gear'}
                </h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Cancel"
                >
                    <X className="w-5 h-5 text-white/60" />
                </button>
            </div>

            {/* Name field - required */}
            <div className="space-y-1.5">
                <label htmlFor="gear-name" className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="gear-name"
                    type="text"
                    className={`w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white placeholder:text-white/20 ${
                        errors.name ? 'ring-2 ring-red-500/50' : ''
                    }`}
                    placeholder="e.g. My Main Telescope"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                />
                {errors.name && (
                    <p className="text-xs text-red-400">{errors.name}</p>
                )}
            </div>

            {/* Gear Type select - required */}
            <div className="space-y-1.5">
                <label htmlFor="gear-type" className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Gear Type <span className="text-red-400">*</span>
                </label>
                <select
                    id="gear-type"
                    className={`w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white ${
                        errors.gear_type ? 'ring-2 ring-red-500/50' : ''
                    }`}
                    value={formData.gear_type}
                    onChange={(e) => {
                        setFormData({ ...formData, gear_type: e.target.value as GearType })
                        if (errors.gear_type) setErrors({ ...errors, gear_type: undefined })
                    }}
                >
                    <option value="" className="bg-[#050810]">Select a gear type</option>
                    {VALID_GEAR_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-[#050810]">
                            {GEAR_TYPE_LABELS[type]}
                        </option>
                    ))}
                </select>
                {errors.gear_type && (
                    <p className="text-xs text-red-400">{errors.gear_type}</p>
                )}
            </div>

            {/* Brand and Model in a grid */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label htmlFor="gear-brand" className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        Brand
                    </label>
                    <input
                        id="gear-brand"
                        type="text"
                        className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white placeholder:text-white/20"
                        placeholder="e.g. Celestron"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="gear-model" className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                        Model
                    </label>
                    <input
                        id="gear-model"
                        type="text"
                        className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all text-sm text-white placeholder:text-white/20"
                        placeholder="e.g. NexStar 8SE"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1.5">
                <label htmlFor="gear-notes" className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Notes
                </label>
                <textarea
                    id="gear-notes"
                    rows={3}
                    className="w-full glass-inner rounded-xl p-3 focus:ring-2 focus:ring-cosmic-purple/50 transition-all resize-none text-sm text-white placeholder:text-white/20"
                    placeholder="Any additional notes about this gear..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 glass-inner rounded-xl font-medium text-sm hover:bg-white/10 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-bold text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isEditMode ? 'Saving...' : 'Adding...'}
                        </>
                    ) : (
                        isEditMode ? 'Save Changes' : 'Add Gear'
                    )}
                </button>
            </div>
        </form>
    )
}
