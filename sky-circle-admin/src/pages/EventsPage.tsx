import { useEffect, useState } from 'react'
import { useAdminStore } from '../store/adminStore'
import { Modal } from '../components/Modal'
import type { Event } from '../types/database.types'
import { Plus, Edit2, Trash2, Loader2, Calendar, MapPin, Users, IndianRupee } from 'lucide-react'

export function EventsPage() {
    const { events, fetchEvents, createEvent, updateEvent, deleteEvent, isLoading } = useAdminStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        capacity: '',
        is_paid: false,
        price: '',
    })

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            location: '',
            event_date: '',
            capacity: '',
            is_paid: false,
            price: '',
        })
        setEditingEvent(null)
    }

    const handleEdit = (event: Event) => {
        setEditingEvent(event)
        setFormData({
            title: event.title,
            description: event.description || '',
            location: event.location,
            event_date: event.event_date.slice(0, 16),
            capacity: event.capacity?.toString() || '',
            is_paid: event.is_paid,
            price: event.price?.toString() || '',
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const eventData = {
            title: formData.title,
            description: formData.description || null,
            location: formData.location,
            event_date: new Date(formData.event_date).toISOString(),
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            is_paid: formData.is_paid,
            price: formData.is_paid && formData.price ? parseFloat(formData.price) : null,
            latitude: null,
            longitude: null,
            created_by: null,
        }

        if (editingEvent) {
            await updateEvent(editingEvent.id, eventData)
        } else {
            await createEvent(eventData)
        }

        setIsModalOpen(false)
        resetForm()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(id)
        }
    }

    const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date())
    const pastEvents = events.filter(e => new Date(e.event_date) < new Date())

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Events</h2>
                    <p className="text-slate-400 text-sm">{events.length} total events</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Event
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Upcoming Events */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-3">Upcoming Events</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {upcomingEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {upcomingEvents.length === 0 && (
                                <p className="text-slate-400 col-span-full">No upcoming events</p>
                            )}
                        </div>
                    </div>

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-3">Past Events</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pastEvents.slice(0, 6).map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        isPast
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    resetForm()
                }}
                title={editingEvent ? 'Edit Event' : 'Create Event'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={formData.event_date}
                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Capacity (optional)</label>
                        <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-slate-300">
                            <input
                                type="checkbox"
                                checked={formData.is_paid}
                                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                                className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            Paid Event
                        </label>
                        {formData.is_paid && (
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        )}
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
                            {editingEvent ? 'Save Changes' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

function EventCard({ 
    event, 
    onEdit, 
    onDelete, 
    isPast = false 
}: { 
    event: Event
    onEdit: (event: Event) => void
    onDelete: (id: string) => void
    isPast?: boolean 
}) {
    return (
        <div className={`bg-slate-800 rounded-xl border border-slate-700 p-4 ${isPast ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-white">{event.title}</h4>
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(event)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(event.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {event.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{event.description}</p>
            )}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(event.event_date).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {event.location}
                </div>
                {event.capacity && (
                    <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-4 h-4 text-slate-400" />
                        Capacity: {event.capacity}
                    </div>
                )}
                {event.is_paid && (
                    <div className="flex items-center gap-2 text-green-400">
                        <IndianRupee className="w-4 h-4" />
                        ₹{event.price?.toFixed(2)}
                    </div>
                )}
            </div>
        </div>
    )
}
