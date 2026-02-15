'use client'

import { useState, useEffect } from 'react'
import { 
    Search, Star, Moon, Sun, Loader2, MapPin, Clock, 
    Compass, Eye, Info, ExternalLink, Sparkles, Globe,
    ChevronRight, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CelestialObject {
    name: string
    type: string
    ra: string // Right Ascension
    dec: string // Declination
    magnitude?: string
    constellation?: string
    description?: string
    aliases?: string[]
}

interface PlanetPosition {
    name: string
    altitude: number
    azimuth: number
    visible: boolean
    riseTime?: string
    setTime?: string
    constellation: string
}

interface ISSPass {
    risetime: number
    duration: number
}

// Equipment types with magnitude limits
type EquipmentType = 'naked-eye' | 'binoculars' | 'small-telescope' | 'large-telescope'

interface Equipment {
    id: EquipmentType
    name: string
    icon: string
    magnitudeLimit: number
    description: string
}

const EQUIPMENT_OPTIONS: Equipment[] = [
    { 
        id: 'naked-eye', 
        name: 'Naked Eye', 
        icon: '👁️', 
        magnitudeLimit: 6, 
        description: 'Dark-adapted eyes in good conditions. Best for bright stars, constellations, and large objects like Milky Way.' 
    },
    { 
        id: 'binoculars', 
        name: 'Binoculars', 
        icon: '🔭', 
        magnitudeLimit: 9, 
        description: '7x50, 10x50, or 15x70 binoculars. Great for star clusters, bright nebulae, and moon craters. Wide field of view.' 
    },
    { 
        id: 'small-telescope', 
        name: 'Small Telescope', 
        icon: '🔬', 
        magnitudeLimit: 12, 
        description: '70-130mm refractor or 4-6" reflector/Dobsonian. Good for planets, double stars, and brighter deep sky objects.' 
    },
    { 
        id: 'large-telescope', 
        name: 'Large Telescope', 
        icon: '🌌', 
        magnitudeLimit: 15, 
        description: '8"+ Dobsonian, SCT, or reflector. Reveals galaxy structure, faint nebulae, and distant globular clusters.' 
    },
]

// Tonight's recommended objects by equipment
interface TonightObject {
    name: string
    query: string
    type: string
    magnitude: number
    constellation: string
    description: string
    bestTime: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
}

const TONIGHT_OBJECTS: TonightObject[] = [
    // Naked Eye (mag < 6)
    { name: 'Pleiades (Seven Sisters)', query: 'M45', type: 'Open Cluster', magnitude: 1.6, constellation: 'Taurus', description: 'Beautiful star cluster visible as a fuzzy patch', bestTime: 'Evening', difficulty: 'Easy' },
    { name: 'Orion Nebula', query: 'M42', type: 'Nebula', magnitude: 4.0, constellation: 'Orion', description: 'Bright nebula in Orion\'s sword', bestTime: 'Evening', difficulty: 'Easy' },
    { name: 'Andromeda Galaxy', query: 'M31', type: 'Galaxy', magnitude: 3.4, constellation: 'Andromeda', description: 'Nearest major galaxy, appears as fuzzy oval', bestTime: 'Evening', difficulty: 'Medium' },
    { name: 'Beehive Cluster', query: 'M44', type: 'Open Cluster', magnitude: 3.7, constellation: 'Cancer', description: 'Large open cluster, best in dark skies', bestTime: 'Late Evening', difficulty: 'Easy' },
    { name: 'Double Cluster', query: 'NGC 869', type: 'Open Cluster', magnitude: 4.3, constellation: 'Perseus', description: 'Two clusters side by side', bestTime: 'Evening', difficulty: 'Easy' },
    
    // Binoculars (mag 6-9)
    { name: 'Lagoon Nebula', query: 'M8', type: 'Nebula', magnitude: 6.0, constellation: 'Sagittarius', description: 'Large emission nebula with dark lanes', bestTime: 'Late Evening', difficulty: 'Easy' },
    { name: 'Wild Duck Cluster', query: 'M11', type: 'Open Cluster', magnitude: 6.3, constellation: 'Scutum', description: 'Rich, compact star cluster', bestTime: 'Late Evening', difficulty: 'Easy' },
    { name: 'Hercules Cluster', query: 'M13', type: 'Globular Cluster', magnitude: 5.8, constellation: 'Hercules', description: 'Best globular cluster in northern sky', bestTime: 'Evening', difficulty: 'Medium' },
    { name: 'Omega Centauri', query: 'NGC 5139', type: 'Globular Cluster', magnitude: 3.9, constellation: 'Centaurus', description: 'Largest globular cluster visible from Earth', bestTime: 'Late Evening', difficulty: 'Easy' },
    { name: 'Bode\'s Galaxy', query: 'M81', type: 'Galaxy', magnitude: 6.9, constellation: 'Ursa Major', description: 'Bright spiral galaxy', bestTime: 'All Night', difficulty: 'Medium' },
    
    // Small Telescope (mag 9-12)
    { name: 'Ring Nebula', query: 'M57', type: 'Planetary Nebula', magnitude: 8.8, constellation: 'Lyra', description: 'Classic ring-shaped planetary nebula', bestTime: 'Evening', difficulty: 'Medium' },
    { name: 'Dumbbell Nebula', query: 'M27', type: 'Planetary Nebula', magnitude: 7.5, constellation: 'Vulpecula', description: 'Large, bright planetary nebula', bestTime: 'Evening', difficulty: 'Easy' },
    { name: 'Whirlpool Galaxy', query: 'M51', type: 'Galaxy', magnitude: 8.4, constellation: 'Canes Venatici', description: 'Face-on spiral with companion galaxy', bestTime: 'All Night', difficulty: 'Medium' },
    { name: 'Crab Nebula', query: 'M1', type: 'Supernova Remnant', magnitude: 8.4, constellation: 'Taurus', description: 'Remnant of 1054 supernova', bestTime: 'Evening', difficulty: 'Medium' },
    { name: 'Sombrero Galaxy', query: 'M104', type: 'Galaxy', magnitude: 8.0, constellation: 'Virgo', description: 'Edge-on galaxy with prominent dust lane', bestTime: 'Late Evening', difficulty: 'Medium' },
    
    // Large Telescope (mag 12+)
    { name: 'Horsehead Nebula', query: 'IC 434', type: 'Dark Nebula', magnitude: 13.0, constellation: 'Orion', description: 'Iconic horse-head shaped dark nebula', bestTime: 'Evening', difficulty: 'Hard' },
    { name: 'Cat\'s Eye Nebula', query: 'NGC 6543', type: 'Planetary Nebula', magnitude: 8.1, constellation: 'Draco', description: 'Complex planetary nebula with intricate structure', bestTime: 'All Night', difficulty: 'Medium' },
    { name: 'Owl Nebula', query: 'M97', type: 'Planetary Nebula', magnitude: 9.9, constellation: 'Ursa Major', description: 'Round nebula with two dark "eyes"', bestTime: 'All Night', difficulty: 'Hard' },
    { name: 'Pinwheel Galaxy', query: 'M101', type: 'Galaxy', magnitude: 7.9, constellation: 'Ursa Major', description: 'Large face-on spiral galaxy', bestTime: 'All Night', difficulty: 'Medium' },
    { name: 'Veil Nebula', query: 'NGC 6992', type: 'Supernova Remnant', magnitude: 7.0, constellation: 'Cygnus', description: 'Delicate supernova remnant filaments', bestTime: 'Evening', difficulty: 'Hard' },
]

// Popular objects for quick search
const POPULAR_OBJECTS = [
    { name: 'Andromeda Galaxy', query: 'M31', type: 'Galaxy' },
    { name: 'Orion Nebula', query: 'M42', type: 'Nebula' },
    { name: 'Pleiades', query: 'M45', type: 'Star Cluster' },
    { name: 'Ring Nebula', query: 'M57', type: 'Nebula' },
    { name: 'Whirlpool Galaxy', query: 'M51', type: 'Galaxy' },
    { name: 'Crab Nebula', query: 'M1', type: 'Nebula' },
    { name: 'Hercules Cluster', query: 'M13', type: 'Globular Cluster' },
    { name: 'Lagoon Nebula', query: 'M8', type: 'Nebula' },
]

// Planet data (simplified - in production would use ephemeris API)
const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']

export default function SkyFinderPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<CelestialObject[]>([])
    const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
    const [activeTab, setActiveTab] = useState<'search' | 'tonight' | 'planets' | 'iss'>('search')
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType>('naked-eye')

    // Set default location (geolocation often blocked by browser policies)
    useEffect(() => {
        // Default to Delhi, India - users can use external tools for precise location
        setUserLocation({ lat: 28.6139, lon: 77.2090 })
    }, [])

    // Get filtered objects for tonight based on equipment
    const getTonightObjects = () => {
        const equipment = EQUIPMENT_OPTIONS.find(e => e.id === selectedEquipment)
        if (!equipment) return []
        
        return TONIGHT_OBJECTS.filter(obj => obj.magnitude <= equipment.magnitudeLimit)
            .sort((a, b) => a.magnitude - b.magnitude)
    }

    // Search celestial objects using SIMBAD
    const searchObjects = async (query: string) => {
        if (!query.trim()) return
        
        setLoading(true)
        setError('')
        setSearchResults([])
        
        try {
            // First try exact identifier search
            const exactResult = await searchByIdentifier(query)
            if (exactResult) {
                setSearchResults([exactResult])
                setLoading(false)
                return
            }
            
            // If no exact match, try wildcard search
            const simbadQuery = encodeURIComponent(`
                SELECT TOP 10 
                    basic.main_id as name,
                    basic.otype_txt as type,
                    basic.ra as ra,
                    basic.dec as dec,
                    allfluxes.V as magnitude
                FROM basic
                LEFT JOIN allfluxes ON basic.oid = allfluxes.oidref
                WHERE basic.main_id LIKE '${query}%'
                ORDER BY CASE WHEN basic.main_id = '${query}' THEN 0 ELSE 1 END
            `)
            
            const response = await fetch(
                `https://simbad.u-strasbg.fr/simbad/sim-tap/sync?request=doQuery&lang=adql&format=json&query=${simbadQuery}`
            )
            
            if (!response.ok) {
                throw new Error('Failed to fetch from SIMBAD')
            }
            
            const data = await response.json()
            
            if (data.data && data.data.length > 0) {
                const results: CelestialObject[] = data.data.map((row: any[]) => ({
                    name: row[0] || 'Unknown',
                    type: row[1] || 'Unknown',
                    ra: formatRA(row[2]),
                    dec: formatDec(row[3]),
                    magnitude: row[4] ? parseFloat(row[4]).toFixed(2) : undefined
                }))
                setSearchResults(results)
            } else {
                setError('No objects found. Try searching for M31, NGC 224, or star names like Sirius.')
            }
        } catch (err) {
            console.error('SIMBAD search error:', err)
            setError('Search failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Search by exact identifier (M31, NGC 224, etc.)
    const searchByIdentifier = async (query: string): Promise<CelestialObject | null> => {
        try {
            const response = await fetch(
                `https://simbad.cds.unistra.fr/simbad/sim-id?output.format=votable&output.params=main_id,otype,ra,dec,flux(V)&Ident=${encodeURIComponent(query)}`
            )
            
            if (!response.ok) return null
            
            const text = await response.text()
            
            // Parse VOTable XML response
            const parser = new DOMParser()
            const xmlDoc = parser.parseFromString(text, 'text/xml')
            
            // Check for errors
            const info = xmlDoc.querySelector('INFO[name="Error"]')
            if (info) return null
            
            // Get table data
            const tableData = xmlDoc.querySelector('TABLEDATA')
            if (!tableData) return null
            
            const tr = tableData.querySelector('TR')
            if (!tr) return null
            
            const tds = tr.querySelectorAll('TD')
            if (tds.length < 4) return null
            
            const name = tds[0]?.textContent?.trim() || query.toUpperCase()
            const type = tds[1]?.textContent?.trim() || 'Unknown'
            const ra = parseFloat(tds[2]?.textContent || '0')
            const dec = parseFloat(tds[3]?.textContent || '0')
            const mag = tds[4]?.textContent?.trim()
            
            return {
                name,
                type: getObjectTypeName(type),
                ra: formatRA(ra),
                dec: formatDec(dec),
                magnitude: mag ? parseFloat(mag).toFixed(2) : undefined
            }
        } catch (err) {
            console.error('Identifier search error:', err)
            return null
        }
    }

    // Get human-readable object type name
    const getObjectTypeName = (code: string): string => {
        const types: Record<string, string> = {
            'G': 'Galaxy',
            'GiG': 'Galaxy in Group',
            'GiC': 'Galaxy in Cluster',
            'HII': 'HII Region',
            'ISM': 'Interstellar Matter',
            'Cl*': 'Star Cluster',
            'GlC': 'Globular Cluster',
            'OpC': 'Open Cluster',
            'As*': 'Association of Stars',
            'PN': 'Planetary Nebula',
            'SNR': 'Supernova Remnant',
            'RNe': 'Reflection Nebula',
            'EmO': 'Emission Object',
            '*': 'Star',
            '**': 'Double Star',
            'V*': 'Variable Star',
            'Psr': 'Pulsar',
            'QSO': 'Quasar',
            'AGN': 'Active Galaxy Nucleus',
            'Sy1': 'Seyfert 1 Galaxy',
            'Sy2': 'Seyfert 2 Galaxy',
        }
        return types[code] || code || 'Celestial Object'
    }

    // Format Right Ascension
    const formatRA = (ra: number | null): string => {
        if (ra === null || ra === undefined) return 'N/A'
        const hours = Math.floor(ra / 15)
        const minutes = Math.floor((ra / 15 - hours) * 60)
        const seconds = ((ra / 15 - hours) * 60 - minutes) * 60
        return `${hours}h ${minutes}m ${seconds.toFixed(1)}s`
    }

    // Format Declination
    const formatDec = (dec: number | null): string => {
        if (dec === null || dec === undefined) return 'N/A'
        const sign = dec >= 0 ? '+' : '-'
        const absDec = Math.abs(dec)
        const degrees = Math.floor(absDec)
        const minutes = Math.floor((absDec - degrees) * 60)
        const seconds = ((absDec - degrees) * 60 - minutes) * 60
        return `${sign}${degrees}° ${minutes}' ${seconds.toFixed(1)}"`
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        searchObjects(searchQuery)
    }

    const handleQuickSearch = (query: string) => {
        setSearchQuery(query)
        searchObjects(query)
    }

    return (
        <div className="py-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary-200/20 to-warning-100/20 flex items-center justify-center">
                    <Compass className="w-8 h-8 text-primary-200" />
                </div>
                <div>
                    <h1 className="text-4xl font-black">Sky Finder</h1>
                    <p className="text-surface-400">Search and discover celestial objects</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {[
                    { id: 'search', label: 'Object Search', icon: Search },
                    { id: 'tonight', label: 'What to See Tonight', icon: Eye },
                    { id: 'planets', label: 'Planets Tonight', icon: Globe },
                    { id: 'iss', label: 'ISS Tracker', icon: Sparkles },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-primary-200/30 to-danger-100/20 text-surface-50"
                                : "glass-effect text-surface-400 hover:text-surface-50 hover:bg-white/10"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="space-y-6">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="relative">
                        <div className="glass-effect rounded-2xl p-2 flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search objects (M31, NGC 224, Sirius, Orion...)"
                                    className="w-full pl-12 pr-4 py-4 bg-transparent text-surface-50 placeholder-surface-500 focus:outline-none text-lg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !searchQuery.trim()}
                                className="px-6 py-4 bg-gradient-to-r from-primary-200 to-danger-100 rounded-xl font-bold text-white disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Quick Search */}
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-3">Popular Objects</h3>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_OBJECTS.map(obj => (
                                <button
                                    key={obj.query}
                                    onClick={() => handleQuickSearch(obj.query)}
                                    className="px-4 py-2 glass-effect rounded-xl text-sm font-medium text-surface-300 hover:text-surface-50 hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <Star className="w-3 h-3 text-warning-100" />
                                    {obj.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="glass-effect rounded-2xl p-4 border border-danger-100/30">
                            <p className="text-danger-100 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-surface-500">Search Results</h3>
                            {searchResults.map((obj, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedObject(obj)}
                                    className="glass-effect rounded-2xl p-6 cursor-pointer hover:scale-[1.01] transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary-200/20 flex items-center justify-center">
                                                <Star className="w-6 h-6 text-primary-200" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-surface-50">{obj.name}</h4>
                                                <p className="text-surface-400 text-sm">{obj.type}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                                                    <span>RA: {obj.ra}</span>
                                                    <span>Dec: {obj.dec}</span>
                                                    {obj.magnitude && <span>Mag: {obj.magnitude}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-surface-500 group-hover:text-surface-300 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-200" />
                        </div>
                    )}
                </div>
            )}

            {/* Tonight Tab */}
            {activeTab === 'tonight' && (
                <div className="space-y-6">
                    {/* Equipment Selector */}
                    <div className="glass-effect rounded-2xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-4">Select Your Equipment</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {EQUIPMENT_OPTIONS.map(equipment => (
                                <button
                                    key={equipment.id}
                                    onClick={() => setSelectedEquipment(equipment.id)}
                                    className={cn(
                                        "p-4 rounded-xl transition-all text-left",
                                        selectedEquipment === equipment.id
                                            ? "bg-gradient-to-br from-primary-200/30 to-danger-100/20 border border-primary-200/50"
                                            : "glass-inner hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-2xl mb-2 block">{equipment.icon}</span>
                                    <h4 className="font-bold text-surface-50 text-sm">{equipment.name}</h4>
                                    <p className="text-surface-500 text-xs mt-1">{equipment.description}</p>
                                    <p className="text-primary-200 text-xs mt-2">Up to mag {equipment.magnitudeLimit}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location Info */}
                    {userLocation && (
                        <div className="glass-effect rounded-2xl p-4 flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary-200" />
                            <div>
                                <p className="text-surface-400 text-sm">
                                    Showing objects visible from your location ({userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tonight's Objects */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-surface-500">
                                Recommended Objects ({getTonightObjects().length})
                            </h3>
                            <span className="text-xs text-surface-500">
                                {EQUIPMENT_OPTIONS.find(e => e.id === selectedEquipment)?.name}
                            </span>
                        </div>
                        
                        {getTonightObjects().map((obj, index) => (
                            <div
                                key={index}
                                onClick={() => handleQuickSearch(obj.query)}
                                className="glass-effect rounded-2xl p-6 cursor-pointer hover:scale-[1.01] transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                                        obj.type.includes('Galaxy') ? 'bg-purple-500/20' :
                                        obj.type.includes('Nebula') ? 'bg-pink-500/20' :
                                        obj.type.includes('Cluster') ? 'bg-blue-500/20' :
                                        'bg-primary-200/20'
                                    )}>
                                        <Star className={cn(
                                            "w-7 h-7",
                                            obj.type.includes('Galaxy') ? 'text-purple-400' :
                                            obj.type.includes('Nebula') ? 'text-pink-400' :
                                            obj.type.includes('Cluster') ? 'text-blue-400' :
                                            'text-primary-200'
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-surface-50">{obj.name}</h4>
                                                <p className="text-surface-400 text-sm">{obj.type} in {obj.constellation}</p>
                                            </div>
                                            <span className={cn(
                                                "px-2 py-1 rounded-lg text-xs font-bold shrink-0",
                                                obj.difficulty === 'Easy' ? 'bg-success-100/20 text-success-100' :
                                                obj.difficulty === 'Medium' ? 'bg-warning-100/20 text-warning-100' :
                                                'bg-danger-100/20 text-danger-100'
                                            )}>
                                                {obj.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-surface-500 text-sm mt-2">{obj.description}</p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3" />
                                                Mag {obj.magnitude.toFixed(1)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {obj.bestTime}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-surface-500 group-hover:text-surface-300 transition-colors shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="glass-effect rounded-2xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-3">Viewing Tips</h3>
                        <ul className="space-y-2 text-surface-400 text-sm">
                            <li className="flex items-start gap-2">
                                <Moon className="w-4 h-4 text-warning-100 shrink-0 mt-0.5" />
                                <span>Check moon phase - darker skies reveal fainter objects</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-primary-200 shrink-0 mt-0.5" />
                                <span>Allow 20-30 minutes for your eyes to adapt to darkness</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-success-100 shrink-0 mt-0.5" />
                                <span>Find a location away from city lights for best results</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Planets Tab */}
            {activeTab === 'planets' && (
                <div className="space-y-4">
                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Info className="w-5 h-5 text-primary-200" />
                            <p className="text-surface-400 text-sm">
                                Planet visibility based on your location. Best viewing times vary by season.
                            </p>
                        </div>
                        {userLocation && (
                            <div className="flex items-center gap-2 text-xs text-surface-500">
                                <MapPin className="w-4 h-4" />
                                <span>Location: {userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°</span>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {PLANETS.map(planet => (
                            <div key={planet} className="glass-effect rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center",
                                        planet === 'Mars' ? 'bg-danger-100/20' :
                                        planet === 'Jupiter' ? 'bg-warning-100/20' :
                                        planet === 'Saturn' ? 'bg-secondary-200/20' :
                                        planet === 'Venus' ? 'bg-warning-100/20' :
                                        'bg-primary-200/20'
                                    )}>
                                        <Globe className={cn(
                                            "w-7 h-7",
                                            planet === 'Mars' ? 'text-danger-100' :
                                            planet === 'Jupiter' ? 'text-warning-100' :
                                            planet === 'Saturn' ? 'text-secondary-200' :
                                            planet === 'Venus' ? 'text-warning-100' :
                                            'text-primary-200'
                                        )} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-surface-50">{planet}</h4>
                                        <p className="text-surface-400 text-sm">
                                            {planet === 'Venus' && 'Morning/Evening Star - Very bright'}
                                            {planet === 'Mars' && 'The Red Planet - Look for reddish hue'}
                                            {planet === 'Jupiter' && 'Gas Giant - Brightest planet'}
                                            {planet === 'Saturn' && 'Ringed Planet - Visible rings with telescope'}
                                            {planet === 'Mercury' && 'Closest to Sun - Hard to spot'}
                                            {planet === 'Uranus' && 'Ice Giant - Needs telescope'}
                                            {planet === 'Neptune' && 'Distant Ice Giant - Telescope required'}
                                        </p>
                                    </div>
                                    <a
                                        href={`https://stellarium-web.org/skysource/${planet}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-surface-50 transition-all"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ISS Tab */}
            {activeTab === 'iss' && (
                <div className="space-y-6">
                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-200/20 to-secondary-200/20 flex items-center justify-center">
                                <Sparkles className="w-7 h-7 text-primary-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-surface-50">International Space Station</h3>
                                <p className="text-surface-400">The ISS orbits Earth every ~90 minutes at 400km altitude</p>
                            </div>
                        </div>
                        
                        <div className="glass-inner rounded-xl p-4 mb-4">
                            <p className="text-surface-400 text-sm">
                                <Info className="w-4 h-4 inline mr-2 text-warning-100" />
                                For accurate pass times specific to your location, use NASA&apos;s official tracker below.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://spotthestation.nasa.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-200/20 rounded-xl text-primary-200 hover:bg-primary-200/30 text-sm font-medium transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                NASA Spot The Station
                            </a>
                            <a
                                href="https://www.heavens-above.com/PassSummary.aspx?satid=25544"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 glass-inner rounded-xl text-surface-300 hover:text-surface-50 hover:bg-white/10 text-sm font-medium transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Heavens Above
                            </a>
                            <a
                                href="https://isstracker.pl/en"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 glass-inner rounded-xl text-surface-300 hover:text-surface-50 hover:bg-white/10 text-sm font-medium transition-all"
                            >
                                <Globe className="w-4 h-4" />
                                Live ISS Tracker
                            </a>
                        </div>
                    </div>

                    {/* ISS Facts */}
                    <div className="glass-effect rounded-2xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-4">ISS Quick Facts</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-inner rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-primary-200">400</p>
                                <p className="text-surface-500 text-xs">km altitude</p>
                            </div>
                            <div className="glass-inner rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-warning-100">27,600</p>
                                <p className="text-surface-500 text-xs">km/h speed</p>
                            </div>
                            <div className="glass-inner rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-success-100">90</p>
                                <p className="text-surface-500 text-xs">min per orbit</p>
                            </div>
                            <div className="glass-inner rounded-xl p-4 text-center">
                                <p className="text-2xl font-black text-danger-100">16</p>
                                <p className="text-surface-500 text-xs">sunrises/day</p>
                            </div>
                        </div>
                    </div>

                    {/* Viewing Tips */}
                    <div className="glass-effect rounded-2xl p-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-surface-500 mb-4">How to Spot the ISS</h3>
                        <ul className="space-y-3 text-surface-400 text-sm">
                            <li className="flex items-start gap-3">
                                <Eye className="w-5 h-5 text-primary-200 shrink-0 mt-0.5" />
                                <span>ISS appears as a bright, steady light moving across the sky (no blinking like planes)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-warning-100 shrink-0 mt-0.5" />
                                <span>Best visible during dawn or dusk when the station reflects sunlight against a dark sky</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Compass className="w-5 h-5 text-success-100 shrink-0 mt-0.5" />
                                <span>Passes typically last 2-6 minutes, moving from west to east</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Star className="w-5 h-5 text-danger-100 shrink-0 mt-0.5" />
                                <span>Can be brighter than Venus (-4 magnitude) during optimal passes</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Object Detail Modal */}
            {selectedObject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-effect rounded-3xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-primary-200/20 flex items-center justify-center">
                                    <Star className="w-7 h-7 text-primary-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-surface-50">{selectedObject.name}</h2>
                                    <p className="text-surface-400">{selectedObject.type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedObject(null)}
                                className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-surface-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-inner rounded-xl p-4">
                                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Right Ascension</p>
                                    <p className="font-bold text-surface-50">{selectedObject.ra}</p>
                                </div>
                                <div className="glass-inner rounded-xl p-4">
                                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Declination</p>
                                    <p className="font-bold text-surface-50">{selectedObject.dec}</p>
                                </div>
                            </div>

                            {selectedObject.magnitude && (
                                <div className="glass-inner rounded-xl p-4">
                                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Apparent Magnitude</p>
                                    <p className="font-bold text-surface-50">{selectedObject.magnitude}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <a
                                    href={`https://stellarium-web.org/skysource/${encodeURIComponent(selectedObject.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 glass-effect rounded-xl font-bold text-center text-surface-300 hover:text-surface-50 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Globe className="w-4 h-4" />
                                    View in Stellarium
                                </a>
                                <a
                                    href={`https://simbad.u-strasbg.fr/simbad/sim-id?Ident=${encodeURIComponent(selectedObject.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 glass-effect rounded-xl font-bold text-center text-surface-300 hover:text-surface-50 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Info className="w-4 h-4" />
                                    SIMBAD Details
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
