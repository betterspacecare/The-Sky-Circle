'use client'

import { useEffect, useState, useMemo } from 'react'

interface Star {
    id: number
    left: number
    top: number
    size: number
    delay: number
    duration: number
    type: 'normal' | 'slow' | 'fast'
    color: 'white' | 'purple' | 'pink' | 'blue' | 'gold'
}

interface ShootingStar {
    id: number
    left: number
    top: number
    delay: number
}

interface StarFieldProps {
    starCount?: number
    showShootingStars?: boolean
    className?: string
}

export function StarField({ 
    starCount = 80, 
    showShootingStars = true,
    className = ''
}: StarFieldProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const stars = useMemo(() => {
        return Array.from({ length: starCount }, (_, i): Star => {
            const rand = Math.random()
            let type: Star['type'] = 'normal'
            if (rand < 0.2) type = 'slow'
            else if (rand > 0.8) type = 'fast'

            const colorRand = Math.random()
            let color: Star['color'] = 'white'
            if (colorRand < 0.1) color = 'purple'
            else if (colorRand < 0.18) color = 'pink'
            else if (colorRand < 0.25) color = 'blue'
            else if (colorRand < 0.3) color = 'gold'

            return {
                id: i,
                left: Math.random() * 100,
                top: Math.random() * 100,
                size: Math.random() * 2.5 + 0.5,
                delay: Math.random() * 5,
                duration: 2 + Math.random() * 4,
                type,
                color
            }
        })
    }, [starCount])

    const shootingStars = useMemo(() => {
        if (!showShootingStars) return []
        return Array.from({ length: 3 }, (_, i): ShootingStar => ({
            id: i,
            left: Math.random() * 70,
            top: Math.random() * 50,
            delay: i * 8 + Math.random() * 5
        }))
    }, [showShootingStars])

    if (!mounted) return null

    return (
        <div className={`star-field ${className}`}>
            {stars.map(star => (
                <div
                    key={star.id}
                    className={`star ${star.type === 'slow' ? 'star-slow' : star.type === 'fast' ? 'star-fast' : ''} ${star.color !== 'white' ? `star-${star.color}` : ''}`}
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDelay: `${star.delay}s`,
                        animationDuration: `${star.duration}s`
                    }}
                />
            ))}
            {shootingStars.map(star => (
                <div
                    key={`shooting-${star.id}`}
                    className="shooting-star"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        animationDelay: `${star.delay}s`
                    }}
                />
            ))}
        </div>
    )
}
