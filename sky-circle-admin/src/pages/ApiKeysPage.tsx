import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import type { ApiKey } from '../types/database.types'
import { 
    Key, Copy, Eye, EyeOff, Plus, CheckCircle, Code, Zap, 
    Trash2, Edit2, RefreshCw, Loader2, Activity, Clock, TrendingUp
} from 'lucide-react'

export function ApiKeysPage() {
    const { apiKeys, apiKeyLogs, apiKeyStats, fetchApiKeys, fetchApiKeyLogs, fetchApiKeyStats, createApiKey, updateApiKey, deleteApiKey, regenerateApiKey, isLoading } = useAdminStore()
    const [showKey, setShowKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
    const [viewingLogs, setViewingLogs] = useState<string | null>(null)
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
    const [formData, setFormData] = useState<{
        name: string
        description: string
        permissions: string[]
        expires_at: string
    }>({
        name: '',
        description: '',
        permissions: ['read'],
        expires_at: ''
    })

    useEffect(() => {
        fetchApiKeys()
        fetchApiKeyStats()
        fetchApiKeyLogs()
    }, [fetchApiKeys, fetchApiKeyStats, fetchApiKeyLogs])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCreate = () => {
        setIsCreating(true)
        setFormData({
            name: '',
            description: '',
            permissions: ['read'],
            expires_at: ''
        })
    }

    const handleSave = async () => {
        if (editingKey) {
            await updateApiKey(editingKey.id, formData)
            setEditingKey(null)
        } else if (isCreating) {
            const result = await createApiKey(formData)
            if (result.apiKey) {
                setNewKeyValue(result.apiKey)
                setIsCreating(false)
            } else if (result.error) {
                alert(`Error: ${result.error}`)
            }
        }
        setFormData({ name: '', description: '', permissions: ['read'], expires_at: '' })
    }

    const handleEdit = (key: ApiKey) => {
        setEditingKey(key)
        setFormData({
            name: key.name,
            description: key.description || '',
            permissions: key.permissions,
            expires_at: key.expires_at || ''
        })
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this API key? This action cannot be undone and will break any integrations using this key.')) {
            await deleteApiKey(id)
        }
    }

    const handleRegenerate = async (id: string) => {
        if (confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
            const result = await regenerateApiKey(id)
            if (result.apiKey) {
                setNewKeyValue(result.apiKey)
            } else if (result.error) {
                alert(`Error: ${result.error}`)
            }
        }
    }

    const handleTogglePermission = (permission: string) => {
        const currentPermissions = formData.permissions || []
        if (currentPermissions.includes(permission)) {
            setFormData({ ...formData, permissions: currentPermissions.filter(p => p !== permission) })
        } else {
            setFormData({ ...formData, permissions: [...currentPermissions, permission] })
        }
    }

    const getStats = (keyId: string) => {
        return apiKeyStats.find(s => s.id === keyId)
    }

    const integrations = [
        {
            name: 'Zapier',
            logo: '⚡',
            description: 'Connect to 5,000+ apps',
            webhookUrl: 'https://hooks.zapier.com/hooks/catch/YOUR_ID/',
            color: 'from-orange-500 to-amber-500'
        },
        {
            name: 'Make (Integromat)',
            logo: '🔷',
            description: 'Visual automation platform',
            webhookUrl: 'https://hook.integromat.com/YOUR_WEBHOOK_ID',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            name: 'n8n',
            logo: '🔗',
            description: 'Self-hosted automation',
            webhookUrl: 'https://your-n8n.com/webhook/YOUR_ID',
            color: 'from-purple-500 to-pink-500'
        },
        {
            name: 'IFTTT',
            logo: '🔀',
            description: 'Simple automation',
            webhookUrl: 'https://maker.ifttt.com/trigger/YOUR_EVENT/with/key/YOUR_KEY',
            color: 'from-green-500 to-emerald-500'
        }
    ]

    const endpoints = [
        {
            method: 'GET',
            path: '/api/v1/triggers/users/new',
            description: 'Get new users (polling trigger)',
            params: 'since, limit'
        },
        {
            method: 'GET',
            path: '/api/v1/triggers/observations/new',
            description: 'Get new observations',
            params: 'since, limit'
        },
        {
            method: 'GET',
            path: '/api/v1/triggers/posts/new',
            description: 'Get new posts',
            params: 'since, limit'
        },
        {
            method: 'POST',
            path: '/api/v1/actions/alerts',
            description: 'Create sky alert',
            params: 'title, message, alert_type'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
                        <Key className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gradient">API Keys & Integrations</h2>
                        <p className="text-white/40 text-sm">Connect SkyGuild with external automation platforms</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                >
                    <Plus className="w-5 h-5" />
                    Create API Key
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <Key className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-white">{apiKeys.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Keys</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-green-400">{apiKeys.filter(k => k.is_active).length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Active</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-blue-400">{apiKeyLogs.length}</div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Requests</div>
                </div>
                <div className="glass-card rounded-2xl p-4 group hover:scale-105 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-amber-400">
                        {apiKeyStats.length > 0 ? Math.round(apiKeyStats.reduce((sum, s) => sum + (s.avg_response_time_ms || 0), 0) / apiKeyStats.length) : 0}ms
                    </div>
                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Avg Response</div>
                </div>
            </div>

            {/* API Keys Table */}
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
                                    <th className="px-4 py-4 font-semibold">Key</th>
                                    <th className="px-4 py-4 font-semibold">Permissions</th>
                                    <th className="px-4 py-4 font-semibold">Usage</th>
                                    <th className="px-4 py-4 font-semibold">Last Used</th>
                                    <th className="px-4 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {apiKeys.map((key) => {
                                    const stats = getStats(key.id)
                                    return (
                                        <tr key={key.id} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {key.name}
                                                        {!key.is_active && (
                                                            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs">Disabled</span>
                                                        )}
                                                    </div>
                                                    {key.description && (
                                                        <div className="text-xs text-white/40 mt-1">{key.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm text-white/60 font-mono">
                                                        {showKey === key.id ? key.key_prefix : '••••••••••••'}
                                                    </code>
                                                    <button
                                                        onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                                                        className="text-white/40 hover:text-white transition-colors"
                                                    >
                                                        {showKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-1">
                                                    {key.permissions.map(p => (
                                                        <span key={p} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold capitalize">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {stats && (
                                                    <div className="text-sm">
                                                        <div className="text-white font-semibold">{stats.total_requests} requests</div>
                                                        <div className="text-xs text-white/40">
                                                            {stats.successful_requests} success / {stats.failed_requests} failed
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-white/40 text-sm">
                                                {key.last_used_at ? (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(key.last_used_at).toLocaleString()}
                                                    </div>
                                                ) : (
                                                    'Never'
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleRegenerate(key.id)}
                                                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="Regenerate key"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewingLogs(key.id)}
                                                        className="p-2 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                                                        title="View logs"
                                                    >
                                                        <Activity className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(key)}
                                                        className="p-2 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(key.id)}
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

                {!isLoading && apiKeys.length === 0 && (
                    <div className="text-center py-12 text-white/30">
                        No API keys found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Integration Platforms */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Supported Platforms
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {integrations.map((integration) => (
                        <div key={integration.name} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center text-2xl`}>
                                        {integration.logo}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{integration.name}</h4>
                                        <p className="text-xs text-white/40">{integration.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 mb-2">
                                    Webhook URL Format
                                </label>
                                <div className="px-3 py-2 bg-black/30 rounded-lg text-xs text-white/60 font-mono break-all">
                                    {integration.webhookUrl}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Endpoints */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-400" />
                    Available Endpoints
                </h3>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-purple-500/10 border-b border-purple-500/20">
                                <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-4 font-semibold">Method</th>
                                    <th className="px-4 py-4 font-semibold">Endpoint</th>
                                    <th className="px-4 py-4 font-semibold">Description</th>
                                    <th className="px-4 py-4 font-semibold">Parameters</th>
                                </tr>
                            </thead>
                            <tbody className="text-white/80">
                                {endpoints.map((endpoint, index) => (
                                    <tr key={index} className="border-t border-purple-500/10 hover:bg-purple-500/5 transition-colors">
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                endpoint.method === 'GET' 
                                                    ? 'bg-blue-500/20 text-blue-300' 
                                                    : 'bg-green-500/20 text-green-300'
                                            }`}>
                                                {endpoint.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-mono text-sm text-purple-300">
                                            {endpoint.path}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {endpoint.description}
                                        </td>
                                        <td className="px-4 py-4 text-xs text-white/40 font-mono">
                                            {endpoint.params}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Usage Example */}
            <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-400" />
                    Usage Example
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            cURL Request
                        </label>
                        <pre className="p-4 bg-black/30 rounded-xl text-xs text-white/70 overflow-x-auto">
{`curl -X GET "https://your-domain.com/api/v1/triggers/users/new?limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                        </pre>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Response
                        </label>
                        <pre className="p-4 bg-black/30 rounded-xl text-xs text-white/70 overflow-x-auto">
{`{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "since": "2024-01-01T11:45:00Z",
    "limit": 10
  }
}`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Documentation Link */}
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
                        <p className="text-sm text-white/60">
                            Check out our comprehensive API documentation and integration guides.
                        </p>
                    </div>
                    <a
                        href="/docs/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 btn-cosmic rounded-xl font-bold text-white whitespace-nowrap"
                    >
                        View Docs
                    </a>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={!!editingKey || isCreating}
                onClose={() => {
                    setEditingKey(null)
                    setIsCreating(false)
                }}
                title={editingKey ? 'Edit API Key' : 'Create API Key'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Production API Key"
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Used for Zapier integration"
                            rows={2}
                            className="w-full px-4 py-3 glass-input rounded-xl text-white resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-3">
                            Permissions
                        </label>
                        <div className="space-y-2">
                            {['read', 'write', 'admin'].map((permission) => (
                                <label
                                    key={permission}
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(permission)}
                                        onChange={() => handleTogglePermission(permission)}
                                        className="w-4 h-4 rounded border-purple-500/30 bg-transparent text-purple-600 focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="text-sm text-white/80 font-semibold capitalize">{permission}</span>
                                        <p className="text-xs text-white/40">
                                            {permission === 'read' && 'Can read data from API endpoints'}
                                            {permission === 'write' && 'Can create and update data'}
                                            {permission === 'admin' && 'Full access to all endpoints'}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Expiration Date (optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                            className="w-full px-4 py-3 glass-input rounded-xl text-white"
                        />
                        <p className="text-xs text-white/30 mt-2">
                            Leave empty for no expiration
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setEditingKey(null)
                                setIsCreating(false)
                            }}
                            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name || formData.permissions.length === 0}
                            className="px-6 py-2.5 btn-cosmic rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingKey ? 'Save Changes' : 'Create API Key'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Key Modal */}
            <Modal
                isOpen={!!newKeyValue}
                onClose={() => setNewKeyValue(null)}
                title="API Key Created Successfully"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-green-300 font-semibold mb-1">Save This Key Now!</p>
                                <p className="text-xs text-green-200/80">
                                    This is the only time you'll see this key. Make sure to copy it and store it securely.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">
                            Your New API Key
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-4 py-3 glass-input rounded-xl text-white font-mono text-sm break-all">
                                {newKeyValue}
                            </div>
                            <button
                                onClick={() => copyToClipboard(newKeyValue!)}
                                className="px-4 py-3 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-xl transition-all flex items-center gap-2"
                            >
                                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setNewKeyValue(null)}
                            className="px-6 py-2.5 btn-cosmic rounded-xl font-bold text-white"
                        >
                            I've Saved My Key
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Logs Modal */}
            <Modal
                isOpen={!!viewingLogs}
                onClose={() => setViewingLogs(null)}
                title="API Key Usage Logs"
            >
                <div className="space-y-4">
                    <p className="text-sm text-white/60">
                        Showing last 100 requests
                    </p>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
                        {apiKeyLogs
                            .filter(log => !viewingLogs || log.api_key_id === viewingLogs)
                            .map((log) => (
                                <div key={log.id} className="glass-input rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                log.method === 'GET' 
                                                    ? 'bg-blue-500/20 text-blue-300' 
                                                    : 'bg-green-500/20 text-green-300'
                                            }`}>
                                                {log.method}
                                            </span>
                                            <span className="text-sm text-white/70 font-mono">{log.endpoint}</span>
                                            {log.status_code && (
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    log.status_code >= 200 && log.status_code < 300
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {log.status_code}
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
                                    {log.response_time_ms && (
                                        <div className="text-xs text-white/40">
                                            Response time: {log.response_time_ms}ms
                                        </div>
                                    )}
                                </div>
                            ))}
                        {apiKeyLogs.filter(log => !viewingLogs || log.api_key_id === viewingLogs).length === 0 && (
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
