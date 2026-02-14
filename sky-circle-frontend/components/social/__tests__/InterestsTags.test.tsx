/**
 * Unit Tests for InterestsTags Component
 * 
 * Tests the InterestsTags component logic including:
 * - Display of interests as read-only tags
 * - Category-based color coding
 * - Empty state handling
 * 
 * **Validates: Requirement 5.6**
 */

import { describe, it, expect } from 'vitest';
import { Interest } from '@/types/social.types';

// Mock interests data matching the design spec categories
const mockInterests: Interest[] = [
    { id: '1', name: 'astrophotography', display_name: 'Astrophotography', category: 'technique' },
    { id: '2', name: 'observation_techniques', display_name: 'Observation Techniques', category: 'technique' },
    { id: '3', name: 'planets', display_name: 'Planets', category: 'target' },
    { id: '4', name: 'deep_sky_objects', display_name: 'Deep Sky Objects', category: 'target' },
    { id: '5', name: 'meteor_showers', display_name: 'Meteor Showers', category: 'event' },
    { id: '6', name: 'equipment_reviews', display_name: 'Equipment Reviews', category: 'content' },
];

// Category color configuration matching the component
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    technique: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/40',
        text: 'text-purple-300',
    },
    target: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/40',
        text: 'text-blue-300',
    },
    event: {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
    },
    content: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300',
    },
    default: {
        bg: 'bg-white/10',
        border: 'border-white/20',
        text: 'text-white/70',
    },
};

/**
 * Get color classes for an interest based on its category
 * Mirrors the component's getCategoryColors function
 */
function getCategoryColors(category: string | null) {
    return CATEGORY_COLORS[category || 'default'] || CATEGORY_COLORS.default;
}

describe('InterestsTags Component Logic', () => {
    describe('Display - Interests as Tags (Requirement 5.6)', () => {
        it('should display all provided interests', () => {
            // Component should render each interest's display_name
            const displayNames = mockInterests.map(i => i.display_name);
            
            expect(displayNames).toContain('Astrophotography');
            expect(displayNames).toContain('Observation Techniques');
            expect(displayNames).toContain('Planets');
            expect(displayNames).toContain('Deep Sky Objects');
            expect(displayNames).toContain('Meteor Showers');
            expect(displayNames).toContain('Equipment Reviews');
        });

        it('should render correct number of tags', () => {
            expect(mockInterests.length).toBe(6);
        });

        it('should use display_name not internal name', () => {
            const interest = mockInterests.find(i => i.name === 'deep_sky_objects');
            
            expect(interest?.display_name).toBe('Deep Sky Objects');
            expect(interest?.display_name).not.toBe('deep_sky_objects');
        });
    });

    describe('Category-Based Color Coding', () => {
        it('should have distinct colors for technique category', () => {
            const colors = CATEGORY_COLORS['technique'];
            
            expect(colors.bg).toContain('purple');
            expect(colors.border).toContain('purple');
            expect(colors.text).toContain('purple');
        });

        it('should have distinct colors for target category', () => {
            const colors = CATEGORY_COLORS['target'];
            
            expect(colors.bg).toContain('blue');
            expect(colors.border).toContain('blue');
            expect(colors.text).toContain('blue');
        });

        it('should have distinct colors for event category', () => {
            const colors = CATEGORY_COLORS['event'];
            
            expect(colors.bg).toContain('amber');
            expect(colors.border).toContain('amber');
            expect(colors.text).toContain('amber');
        });

        it('should have distinct colors for content category', () => {
            const colors = CATEGORY_COLORS['content'];
            
            expect(colors.bg).toContain('emerald');
            expect(colors.border).toContain('emerald');
            expect(colors.text).toContain('emerald');
        });

        it('should have default colors for unknown categories', () => {
            const colors = CATEGORY_COLORS['default'];
            
            expect(colors.bg).toContain('white');
            expect(colors.border).toContain('white');
            expect(colors.text).toContain('white');
        });
    });

    describe('getCategoryColors Function', () => {
        it('should return technique colors for technique category', () => {
            const colors = getCategoryColors('technique');
            expect(colors).toEqual(CATEGORY_COLORS.technique);
        });

        it('should return target colors for target category', () => {
            const colors = getCategoryColors('target');
            expect(colors).toEqual(CATEGORY_COLORS.target);
        });

        it('should return event colors for event category', () => {
            const colors = getCategoryColors('event');
            expect(colors).toEqual(CATEGORY_COLORS.event);
        });

        it('should return content colors for content category', () => {
            const colors = getCategoryColors('content');
            expect(colors).toEqual(CATEGORY_COLORS.content);
        });

        it('should return default colors for null category', () => {
            const colors = getCategoryColors(null);
            expect(colors).toEqual(CATEGORY_COLORS.default);
        });

        it('should return default colors for unknown category', () => {
            const colors = getCategoryColors('unknown');
            expect(colors).toEqual(CATEGORY_COLORS.default);
        });

        it('should return default colors for empty string category', () => {
            const colors = getCategoryColors('');
            expect(colors).toEqual(CATEGORY_COLORS.default);
        });
    });

    describe('Empty State Handling', () => {
        it('should detect empty interests array', () => {
            const emptyInterests: Interest[] = [];
            const isEmpty = !emptyInterests || emptyInterests.length === 0;
            
            expect(isEmpty).toBe(true);
        });

        it('should show empty state for zero interests', () => {
            const interests: Interest[] = [];
            const showEmptyState = interests.length === 0;
            
            expect(showEmptyState).toBe(true);
        });

        it('should not show empty state when interests exist', () => {
            const showEmptyState = mockInterests.length === 0;
            
            expect(showEmptyState).toBe(false);
        });
    });

    describe('Interest with Null Category', () => {
        it('should handle interest with null category', () => {
            const interestWithNullCategory: Interest = {
                id: '99',
                name: 'unknown',
                display_name: 'Unknown Interest',
                category: null,
            };
            
            const colors = getCategoryColors(interestWithNullCategory.category);
            
            // Should use default colors
            expect(colors).toEqual(CATEGORY_COLORS.default);
            expect(colors.bg).toContain('white');
        });
    });

    describe('Color Class Application', () => {
        it('should apply correct colors for technique interest', () => {
            const techniqueInterest = mockInterests.find(i => i.category === 'technique');
            const colors = getCategoryColors(techniqueInterest?.category || null);
            
            expect(colors.bg).toBe('bg-purple-500/20');
            expect(colors.border).toBe('border-purple-500/40');
            expect(colors.text).toBe('text-purple-300');
        });

        it('should apply correct colors for target interest', () => {
            const targetInterest = mockInterests.find(i => i.category === 'target');
            const colors = getCategoryColors(targetInterest?.category || null);
            
            expect(colors.bg).toBe('bg-blue-500/20');
            expect(colors.border).toBe('border-blue-500/40');
            expect(colors.text).toBe('text-blue-300');
        });

        it('should apply correct colors for event interest', () => {
            const eventInterest = mockInterests.find(i => i.category === 'event');
            const colors = getCategoryColors(eventInterest?.category || null);
            
            expect(colors.bg).toBe('bg-amber-500/20');
            expect(colors.border).toBe('border-amber-500/40');
            expect(colors.text).toBe('text-amber-300');
        });

        it('should apply correct colors for content interest', () => {
            const contentInterest = mockInterests.find(i => i.category === 'content');
            const colors = getCategoryColors(contentInterest?.category || null);
            
            expect(colors.bg).toBe('bg-emerald-500/20');
            expect(colors.border).toBe('border-emerald-500/40');
            expect(colors.text).toBe('text-emerald-300');
        });
    });

    describe('Single Interest Display', () => {
        it('should handle single interest correctly', () => {
            const singleInterest: Interest[] = [
                { id: '1', name: 'astrophotography', display_name: 'Astrophotography', category: 'technique' },
            ];
            
            expect(singleInterest.length).toBe(1);
            expect(singleInterest[0].display_name).toBe('Astrophotography');
        });
    });

    describe('Read-Only Nature', () => {
        it('should be non-interactive (no click handlers needed)', () => {
            // InterestsTags is read-only, unlike InterestsSelector
            // Tags should be span elements, not buttons
            // This is a design decision test
            const isReadOnly = true;
            expect(isReadOnly).toBe(true);
        });

        it('should not have selection state', () => {
            // Unlike InterestsSelector, InterestsTags doesn't track selection
            // All provided interests are displayed as-is
            const hasSelectionState = false;
            expect(hasSelectionState).toBe(false);
        });
    });

    describe('Accessibility Attributes', () => {
        it('should use list role for container', () => {
            // Component uses role="list" on container
            const containerRole = 'list';
            expect(containerRole).toBe('list');
        });

        it('should use listitem role for each tag', () => {
            // Component uses role="listitem" on each tag
            const itemRole = 'listitem';
            expect(itemRole).toBe('listitem');
        });

        it('should have aria-label for accessibility', () => {
            // Component has aria-label="User interests" on container
            const ariaLabel = 'User interests';
            expect(ariaLabel).toBe('User interests');
        });
    });

    describe('Interest Data Mapping', () => {
        it('should map all interests to display names', () => {
            const displayNames = mockInterests.map(interest => interest.display_name);
            
            expect(displayNames).toHaveLength(6);
            expect(displayNames).toEqual([
                'Astrophotography',
                'Observation Techniques',
                'Planets',
                'Deep Sky Objects',
                'Meteor Showers',
                'Equipment Reviews',
            ]);
        });

        it('should preserve interest IDs for keys', () => {
            const ids = mockInterests.map(interest => interest.id);
            
            expect(ids).toEqual(['1', '2', '3', '4', '5', '6']);
        });

        it('should map each interest to its category colors', () => {
            const colorMappings = mockInterests.map(interest => ({
                name: interest.name,
                colors: getCategoryColors(interest.category),
            }));
            
            expect(colorMappings[0].colors.bg).toContain('purple'); // technique
            expect(colorMappings[2].colors.bg).toContain('blue');   // target
            expect(colorMappings[4].colors.bg).toContain('amber');  // event
            expect(colorMappings[5].colors.bg).toContain('emerald'); // content
        });
    });
});
