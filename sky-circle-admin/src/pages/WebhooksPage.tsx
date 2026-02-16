import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import type { Webhook, WebhookEvent } from '../types/database.types'
import { 
    Search, Edit2, Trash2, Plus, Loader2, Webhook as WebhookIcon, 
    Activity, AlertCircle, CheckCircle, XCircle, Play, Eye, Trash, 
    Copy, Key, Globe, Zap, Clock
} from 'lucide-react'

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; category: string }[] = [
    // User Events
    { value: 'user.created', label: 'User Created', category: 'Users' },
    { value: 'user.updated', label: 'User Updated', category: 'Users' },
    { value: 'user.deleted', label: 'User Deleted', category: 'Users' },
    
    // Observation Events
    { value: 'observation.created', label: 'Observation Created', category: 'Content' },
    { value: 'observation.updated', label: 'Observation Updated', category: 'Content' },
    { value: 'observation.deleted', label: 'Observation Deleted', category: 'Content' },
    
    // Post Events
    { value: 'post.created', label: 'Post Created', category: 'Content' },
    { value: 'post.reported', label: 'Post Reported', category: 'Content' },
    { value: 'post.deleted', label: 'Post Deleted', category: 'Content' },
    
    // Event Events
    { value: 'event.created', label: 'Event Created', category: 'Events' },
    { value: 'event.updated', label: 'Event Updated', category: 'Events' },
    { value: 'event.rsvp', label: 'Event RSVP', category: 'Events' },
    
    // Gamification Events
    { value: 'mission.completed', label: 'Mission Completed', category: 'Gamification' },
    { value: 'badge.earned', label: 'Badge Earned', category: 'Gamification' },
    
    // Social Events
    { value: 'follow.created', label: 'Follow Created', category: 'Social' },
    { value: 'follow.deleted', label: 'Follow Deleted', category: 'Social' },
    { value: 'comment.created', label: 'Comment Created', category: 'Social' },
    { value: 'like.created', label: 'Like Created', category: 'Social' },
    
    // Referral Events
    { value: 'referral.completed', label: 'Referral Completed', category: 'Referrals' },
]

const statusColors = {
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const statusIcons = {
    active: CheckCircle,
    inactive: AlertCircle,
    failed: XCircle,
}

export function WebhooksPage() {
    const { webhooks, webhookLogs, fetchWebhooks, fetchWebhookLogs, createWebhook, updateWebhook, deleteWebhook, testWebhook, clearWebhookLogs, isLoading } = useAdminStore()
    const [search, setSearch] = useState('')
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [viewingLogs, setViewingLogs] = useState<string | null>(null)
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
    const [formData, setFormData] = useState<Partial<Webhook>>({
        events: []
    })

    useEffect(() => {
        fetchWebhooks()
        fetchWebhookLogs()
    }, [fetchWebhooks, fetchWebhookLogs])

    const filteredWebhooks = webhooks.filter(webhook =>
        webhook.name.toLowerCase().includes(search.toLowerCase()) ||
        webhook.url.toLowerCase().includes(search.toLowerCase()) ||
        webhook.description?.toLowerCase().includes(search.toLowerCase())
    )

    const handleEdit = (webhook: Webhook) => {
        setEditingWebhook(webhook)
        setFormData({
            name: webhook.name,
            description: webhook.description,
            url: webhook.url,
            events: webhook.events,
            secret: webhook.secret,
            is_active: webhook.is_active,
        })
    }

    const handleCreate = () => {
        setIsCreating(true)
        setFormData({
            name: '',
            description: '',
            url: '',
            events: [],
            secret: '',
            is_active: true,
        })
    }

    const handleSave = async () => {
        if (editingWebhook) {
            await updateWebhook(editingWebhook.id, formData)
            setEditingWebhook(null)
        } else if (isCreating) {
            await createWebhook(formData as any)
            setIsCreating(false)
        }
        setFormData({ events: [] })
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
            await deleteWebhook(id)
        }
    }

    const handleTest = async (id: string) => {
        setTestingWebhook(id)
        const result = await testWebhook(id)
        setTestingWebhook(null)
        
        if (result.success) {
            alert('Webhook test successful!')
        } else {
            alert(`Webhook test failed: ${result.error}`)
        }
    }

    const handleViewLogs = (webhookId: string) => {
        setViewingLogs(webhookId)
        fetchWebhookLogs(webhookId)
    }

    const handleToggleEvent = (event: WebhookEvent) => {
        const currentEvents = formData.events || []
        if (currentEvents.includes(event)) {
            setFormData({ ...formData, events: currentEvents.filter(e => e !== event) })
        } else {
            setFormData({ ...formData, events: [...currentEvents, event] })
        }
    }

    const generateSecret = () => {
        const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        setFormData({ ...formData, secret })
    }

    const copySecret = (secret: string) => {
        navigator.clipboard.writeText(secret)
        alert('Secret copied to clipboard!')
    }

    const eventsByCategory = WEBHOOK_EVENTS.reduce((acc, event) => {
        if (!acc[event.category]) acc[event.category] = []
        acc[event.category].push(event)
        return acc
    }, {} as Record<string, typeof WEBHOOK_EVENTS>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <WebhookIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gradient">Webhooks</h2>
                        <p className="text-white/40 text-sm">Automate platform events with webhooks</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                >
                    <Plus className="w-5 h-5" />
                    Create Webhook
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                    type="text"
                    placeholder="Search webhooks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder-white/30"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <WebhookIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-white">{webhooks.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Webhooks</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-green-400">{webhooks.filter(w => w.status === 'active').length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Active</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center mb-3">
                        <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-red-400">{webhooks.filter(w => w.status === 'failed').length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Failed</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-blue-400">{webhookLogs.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Logs</div>
                </div>
            </div>

            {/* Webhooks Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-4 font-semibold">Name</th>
                                    <th className="px-4 py-4 font-semibold">URL</th>
                                    <th className="px-4 py-4 font-semibold">Events</th>
                                    <th className="px-4 py-4 font-semibold">Status</th>
                                    <th className="px-4 py-4 font-semibold">Last Triggered</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {filteredWebhooks.map((webhook) => {
                                    const StatusIcon = statusIcons[webhook.status]
                                    return (
                                        <tr key={webhook.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {webhook.name}
                                                        {!webhook.is_active && (
                                                            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs">Disabled</span>
                                                        )}
                                                    </div>
                                                    {webhook.description && (
                                                        <div className="text-xs text-white/40 mt-1">{webhook.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-sm text-white/60 font-mono">
                                                    <Globe className="w-4 h-4" />
                                                    <span className="truncate max-w-xs">{webhook.url}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-semibold">
                                                    {webhook.events.length} events
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border capitalize ${statusColors[webhook.status]}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {webhook.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-white/40 text-sm">
                                                {webhook.last_triggered_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(webhook.last_triggered_at).toLocaleString()}
                                                    </div>
                                                ) : (
                                                    'Never'
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleTest(webhook.id)}
                                                        disabled={testingWebhook === webhook.id}
                                                        className="p-2 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                                                        title="Test webhook"
                                                    >
                                                        {testingWebhook === webhook.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewLogs(webhook.id)}
                                                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="View logs"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(webhook)}
                                                        className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(webhook.id)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredWebhooks.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        No webhooks found
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={!!editingWebhook || isCreating}
                onClose={() => {
                    setEditingWebhook(null)
                    setIsCreating(false)
                }}
                title={editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Webhook"
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What does this webhook do?"
                            rows={2}
                            className="w-full px-4 py-3 glass-input rounded-xl text-white resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Webhook URL
                        </label>
                        <input
                            type="url"
                            value={formData.url || ''}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://your-domain.com/webhook"
                            className="w-full px-4 py-3 glass-input rounded-xl text-white font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Secret Key (optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.secret || ''}
                                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                                placeholder="Optional secret for signature verification"
                                className="flex-1 px-4 py-3 glass-input rounded-xl text-white font-mono text-sm"
                            />
                            <button
                                onClick={generateSecret}
                                className="px-4 py-3 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-xl transition-all"
                                title="Generate secret"
                            >
                                <Key className="w-5 h-5" />
                            </button>
                            {formData.secret && (
                                <button
                                    onClick={() => copySecret(formData.secret!)}
                                    className="px-4 py-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl transition-all"
                                    title="Copy secret"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-white/30 mt-2">
                            Secret will be sent in X-Webhook-Secret header
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-3">
                            Events to Listen
                        </label>
                        <div className="space-y-3">
                            {Object.entries(eventsByCategory).map(([category, events]) => (
                                <div key={category} className="glass-input rounded-xl p-4">
                                    <div className="text-sm font-bold text-white/80 mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-purple-400" />
                                        {category}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {events.map((event) => (
                                            <label
                                                key={event.value}
                                                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.events?.includes(event.value)}
                                                    onChange={() => handleToggleEvent(event.value)}
                                                    className="w-4 h-4 rounded border-purple-500/30 bg-transparent text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-white/70">{event.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 glass-input rounded-xl">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active ?? true}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-purple-500/30 bg-transparent text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="text-sm text-white/80">
                            <span className="font-semibold">Active</span>
                            <p className="text-xs text-white/40">Enable this webhook to receive events</p>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setEditingWebhook(null)
                                setIsCreating(false)
                            }}
                            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name || !formData.url || !formData.events?.length}
                            className="px-6 py-2.5 btn-cosmic rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingWebhook ? 'Save Changes' : 'Create Webhook'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Logs Modal */}
            <Modal
                isOpen={!!viewingLogs}
                onClose={() => setViewingLogs(null)}
                title="Webhook Logs"
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-white/60">
                            Showing last 100 logs
                        </p>
                        {viewingLogs && (
                            <button
                                onClick={() => clearWebhookLogs(viewingLogs)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg transition-all text-sm"
                            >
                                <Trash className="w-4 h-4" />
                                Clear Logs
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                        {webhookLogs
                            .filter(log => !viewingLogs || log.webhook_id === viewingLogs)
                            .map((log) => (
                                <div key={log.id} className="glass-input rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-mono">
                                                {log.event_type}
                                            </span>
                                            {log.response_status && (
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    log.response_status >= 200 && log.response_status < 300
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {log.response_status}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-white/40">
                                            {new Date(log.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {log.error_message && (
                                        <div className="text-sm text-red-400 mb-2">
                                            Error: {log.error_message}
                                        </div>
                                    )}
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-white/60 hover:text-white">
                                            View payload
                                        </summary>
                                        <pre className="mt-2 p-2 bg-black/30 rounded text-white/70 overflow-x-auto">
                                            {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        {webhookLogs.filter(log => !viewingLogs || log.webhook_id === viewingLogs).length === 0 && (
                            <div className="text-center py-8 text-white/30">
                                No logs found
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
