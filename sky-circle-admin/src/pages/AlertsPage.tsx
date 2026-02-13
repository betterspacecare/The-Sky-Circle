import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { useAuthStore } from '../store/authStore'
import { Modal } from '../components/Modal'
import type { SkyAlert } from '../types/database.types'
import { Plus, Trash2, Loader2, Bell, Star, Sparkles, Eye } from 'lucide-react'

const ALERT_TYPES = [
    { value: 'text', label: 'General Text', icon: Bell },
    { value: 'object_visibility', label: 'Object Visibility', icon: Eye },
    { value: 'meteor_shower', label: 'Meteor Shower', icon: Sparkles },
    { value: 'special_event', label: 'Special Event', icon: Star },
]

export function AlertsPage() {
    const { alerts, fetchAlerts, createAlert, deleteAlert, isLoading } = useAdminStore()
    const { user } = useAuthStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        alert_type: 'text' as SkyAlert['alert_type'],
    })

    useEffect(() => {
        fetchAlerts()
    }, [fetchAlerts])

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            alert_type: 'text',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        await createAlert({
            title: formData.title,
            message: formData.message,
            alert_type: formData.alert_type,
            created_by: user?.id || null,
        })

        setIsModalOpen(false)
        resetForm()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this alert?')) {
            await deleteAlert(id)
        }
    }

    const getAlertIcon = (type: SkyAlert['alert_type']) => {
        const alertType = ALERT_TYPES.find(t => t.value === type)
        return alertType?.icon || Bell
    }

    const getAlertColor = (type: SkyAlert['alert_type']) => {
        switch (type) {
            case 'meteor_shower': return 'from-purple-500 to-pink-500'
            case 'special_event': return 'from-yellow-500 to-orange-500'
            case 'object_visibility': return 'from-blue-500 to-cyan-500'
            default: return 'from-indigo-500 to-purple-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Sky Alerts</h2>
                    <p className="text-slate-400 text-sm">{alerts.length} alerts sent</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Send Alert
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => {
                        const Icon = getAlertIcon(alert.alert_type)
                        return (
                            <div
                                key={alert.id}
                                className="bg-slate-800 rounded-xl border border-slate-700 p-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAlertColor(alert.alert_type)} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-white">{alert.title}</h4>
                                                <span className="inline-block px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs capitalize mt-1">
                                                    {alert.alert_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(alert.id)}
                                                className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-slate-300 mt-2">{alert.message}</p>
                                        <p className="text-slate-500 text-sm mt-2">
                                            Sent on {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {!isLoading && alerts.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No alerts sent yet
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title="Send Sky Alert"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Alert Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ALERT_TYPES.map((type) => {
                                const Icon = type.icon
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, alert_type: type.value as SkyAlert['alert_type'] })}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                            formData.alert_type === type.value
                                                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                                : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm">{type.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Perseid Meteor Shower Tonight!"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Describe the event or alert details..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                resetForm()
                            }}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            Send Alert
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
