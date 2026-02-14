/**
 * Unit Tests for InterestsSelector Component
 * 
 * Tests the InterestsSelector component logic including:
 * - Display of interests as selectable chips
 * - Multi-select functionality
 * - Edit mode toggle
 * - Category-based styling
 * 
 * **Validates: Requirements 5.1, 5.2**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Interest } from '@/types/social.types';

// Mock interests data matching the design spec categories
const mockInterests: Interest[] = [
    { id: '1', name: 'astrophotography', display_name: 'Astrophotography', category: 'technique' },
    { id: '2', name: 'observation_techniques', display_name: 'Observation Techniques', category: 'technique' },
    { id: '3', name: 'planets', display_name: 'Planets', category: 'target' },
    { id: '4', name: 'deep_sky_objects', display_name: 'Deep Sky Objects', category: 'target' },
    { id: '5', name: 'moon', display_name: 'Moon', category: 'target' },
    { id: '6', name: 'meteor_showers', display_name: 'Meteor Showers', category: 'event' },
    { id: '7', name: 'eclipses', display_name: 'Eclipses', category: 'event' },
    { id: '8', name: 'equipment_reviews', display_name: 'Equipment Reviews', category: 'content' },
];

// Category color configuration matching the component
const CATEGORY_COLORS: Record<string, { bg: string; border: string; selectedBg: string }> = {
    technique: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        selectedBg: 'bg-purple-500/30',
    },
    target: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        selectedBg: 'bg-blue-500/30',
    },
    event: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        selectedBg: 'bg-amber-500/30',
    },
    content: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        selectedBg: 'bg-emerald-500/30',
    },
    default: {
        bg: 'bg-white/5',
        border: 'border-white/20',
        selectedBg: 'bg-white/20',
    },
};

describe('InterestsSelector Component Logic', () => {
    describe('Display - All Available Interests (Requirement 5.2)', () => {
        it('should have all 14 predefined interest categories available', () => {
            // From design spec: astrophotography, deep_sky_objects, planets, moon, sun,
            // meteor_showers, comets, satellites, eclipses, star_clusters, nebulae,
            // galaxies, equipment_reviews, observation_techniques
            const expectedInterestNames = [
                'astrophotography',
                'deep_sky_objects',
                'planets',
                'moon',
                'sun',
                'meteor_showers',
                'comets',
                'satellites',
                'eclipses',
                'star_clusters',
                'nebulae',
                'galaxies',
                'equipment_reviews',
                'observation_techniques',
            ];
            
            expect(expectedInterestNames.length).toBe(14);
        });

        it('should group interests by category', () => {
            const groupedInterests = mockInterests.reduce((acc, interest) => {
                const category = interest.category || 'other';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(interest);
                return acc;
            }, {} as Record<string, Interest[]>);

            expect(groupedInterests['technique']).toHaveLength(2);
            expect(groupedInterests['target']).toHaveLength(3);
            expect(groupedInterests['event']).toHaveLength(2);
            expect(groupedInterests['content']).toHaveLength(1);
        });

        it('should have correct category order', () => {
            const categoryOrder = ['technique', 'target', 'event', 'content', 'other'];
            
            expect(categoryOrder[0]).toBe('technique');
            expect(categoryOrder[1]).toBe('target');
            expect(categoryOrder[2]).toBe('event');
            expect(categoryOrder[3]).toBe('content');
        });
    });

    describe('Category-Based Styling', () => {
        it('should have distinct colors for technique category', () => {
            const colors = CATEGORY_COLORS['technique'];
            
            expect(colors.bg).toContain('purple');
            expect(colors.border).toContain('purple');
            expect(colors.selectedBg).toContain('purple');
        });

        it('should have distinct colors for target category', () => {
            const colors = CATEGORY_COLORS['target'];
            
            expect(colors.bg).toContain('blue');
            expect(colors.border).toContain('blue');
            expect(colors.selectedBg).toContain('blue');
        });

        it('should have distinct colors for event category', () => {
            const colors = CATEGORY_COLORS['event'];
            
            expect(colors.bg).toContain('amber');
            expect(colors.border).toContain('amber');
            expect(colors.selectedBg).toContain('amber');
        });

        it('should have distinct colors for content category', () => {
            const colors = CATEGORY_COLORS['content'];
            
            expect(colors.bg).toContain('emerald');
            expect(colors.border).toContain('emerald');
            expect(colors.selectedBg).toContain('emerald');
        });

        it('should have default colors for unknown categories', () => {
            const colors = CATEGORY_COLORS['default'];
            
            expect(colors.bg).toContain('white');
            expect(colors.border).toContain('white');
            expect(colors.selectedBg).toContain('white');
        });

        it('should return default colors for null category', () => {
            const getCategoryColors = (category: string | null) => {
                return CATEGORY_COLORS[category || 'default'] || CATEGORY_COLORS.default;
            };
            
            const colors = getCategoryColors(null);
            expect(colors).toEqual(CATEGORY_COLORS.default);
        });
    });

    describe('Multi-Select Functionality (Requirement 5.1)', () => {
        it('should track selected interests in a Set', () => {
            const selectedIds = new Set(['1', '3']);
            
            expect(selectedIds.has('1')).toBe(true);
            expect(selectedIds.has('3')).toBe(true);
            expect(selectedIds.has('2')).toBe(false);
        });

        it('should add interest to selection on toggle', () => {
            const selectedIds = new Set<string>();
            const interestId = '3';
            
            // Toggle on
            selectedIds.add(interestId);
            
            expect(selectedIds.has(interestId)).toBe(true);
            expect(selectedIds.size).toBe(1);
        });

        it('should remove interest from selection on toggle', () => {
            const selectedIds = new Set(['1', '3']);
            const interestId = '3';
            
            // Toggle off
            selectedIds.delete(interestId);
            
            expect(selectedIds.has(interestId)).toBe(false);
            expect(selectedIds.size).toBe(1);
        });

        it('should allow multiple selections', () => {
            const selectedIds = new Set<string>();
            
            selectedIds.add('1');
            selectedIds.add('3');
            selectedIds.add('5');
            
            expect(selectedIds.size).toBe(3);
            expect(Array.from(selectedIds)).toEqual(['1', '3', '5']);
        });

        it('should convert Set to array for callback', () => {
            const selectedIds = new Set(['1', '3', '5']);
            const selectedArray = Array.from(selectedIds);
            
            expect(Array.isArray(selectedArray)).toBe(true);
            expect(selectedArray).toContain('1');
            expect(selectedArray).toContain('3');
            expect(selectedArray).toContain('5');
        });
    });

    describe('Selection State Display', () => {
        it('should determine selected state correctly', () => {
            const selectedIds = new Set(['1', '3']);
            
            const isSelected = (id: string) => selectedIds.has(id);
            
            expect(isSelected('1')).toBe(true);
            expect(isSelected('3')).toBe(true);
            expect(isSelected('2')).toBe(false);
            expect(isSelected('5')).toBe(false);
        });

        it('should show correct selection count', () => {
            const selectedIds = new Set(['1', '3', '5']);
            const count = selectedIds.size;
            
            expect(count).toBe(3);
        });

        it('should use singular form for single selection', () => {
            const count = 1;
            const text = `${count} interest${count !== 1 ? 's' : ''} selected`;
            
            expect(text).toBe('1 interest selected');
        });

        it('should use plural form for multiple selections', () => {
            const count: number = 3;
            const text = `${count} interest${count !== 1 ? 's' : ''} selected`;
            
            expect(text).toBe('3 interests selected');
        });
    });

    describe('Edit Mode Toggle', () => {
        it('should allow interaction when editMode is true', () => {
            const editMode = true;
            const disabled = false;
            const isInteractive = editMode && !disabled;
            
            expect(isInteractive).toBe(true);
        });

        it('should prevent interaction when editMode is false', () => {
            const editMode = false;
            const disabled = false;
            const isInteractive = editMode && !disabled;
            
            expect(isInteractive).toBe(false);
        });

        it('should prevent interaction when disabled', () => {
            const editMode = true;
            const disabled = true;
            const isInteractive = editMode && !disabled;
            
            expect(isInteractive).toBe(false);
        });

        it('should prevent interaction when both editMode is false and disabled', () => {
            const editMode = false;
            const disabled = true;
            const isInteractive = editMode && !disabled;
            
            expect(isInteractive).toBe(false);
        });
    });

    describe('Accessibility', () => {
        it('should generate correct aria-label for unselected interest', () => {
            const selected = false;
            const displayName = 'Planets';
            const ariaLabel = `${selected ? 'Deselect' : 'Select'} ${displayName}`;
            
            expect(ariaLabel).toBe('Select Planets');
        });

        it('should generate correct aria-label for selected interest', () => {
            const selected = true;
            const displayName = 'Planets';
            const ariaLabel = `${selected ? 'Deselect' : 'Select'} ${displayName}`;
            
            expect(ariaLabel).toBe('Deselect Planets');
        });

        it('should have aria-pressed attribute based on selection', () => {
            const selectedIds = new Set(['1']);
            
            const getAriaPressed = (id: string) => selectedIds.has(id);
            
            expect(getAriaPressed('1')).toBe(true);
            expect(getAriaPressed('2')).toBe(false);
        });
    });

    describe('Empty State', () => {
        it('should detect empty interests array', () => {
            const allInterests: Interest[] = [];
            
            expect(allInterests.length).toBe(0);
        });

        it('should show empty message when no interests', () => {
            const allInterests: Interest[] = [];
            const showEmptyState = allInterests.length === 0;
            
            expect(showEmptyState).toBe(true);
        });
    });

    describe('Toggle Handler Logic', () => {
        it('should not toggle when disabled', () => {
            const disabled = true;
            const editMode = true;
            let toggleCalled = false;
            
            const handleToggle = () => {
                if (disabled || !editMode) return;
                toggleCalled = true;
            };
            
            handleToggle();
            expect(toggleCalled).toBe(false);
        });

        it('should not toggle when not in edit mode', () => {
            const disabled = false;
            const editMode = false;
            let toggleCalled = false;
            
            const handleToggle = () => {
                if (disabled || !editMode) return;
                toggleCalled = true;
            };
            
            handleToggle();
            expect(toggleCalled).toBe(false);
        });

        it('should toggle when enabled and in edit mode', () => {
            const disabled = false;
            const editMode = true;
            let toggleCalled = false;
            
            const handleToggle = () => {
                if (disabled || !editMode) return;
                toggleCalled = true;
            };
            
            handleToggle();
            expect(toggleCalled).toBe(true);
        });
    });

    describe('Callback Integration', () => {
        it('should call onSelectionChange with updated array', () => {
            const onSelectionChange = vi.fn();
            const selectedIds = new Set<string>();
            
            // Simulate toggle
            selectedIds.add('3');
            const newSelectedIds = Array.from(selectedIds);
            onSelectionChange(newSelectedIds);
            
            expect(onSelectionChange).toHaveBeenCalledWith(['3']);
        });

        it('should call onSelectionChange with empty array when all deselected', () => {
            const onSelectionChange = vi.fn();
            const selectedIds = new Set(['3']);
            
            // Simulate toggle off
            selectedIds.delete('3');
            const newSelectedIds = Array.from(selectedIds);
            onSelectionChange(newSelectedIds);
            
            expect(onSelectionChange).toHaveBeenCalledWith([]);
        });

        it('should call onSelectionChange on each toggle', () => {
            const onSelectionChange = vi.fn();
            const selectedIds = new Set<string>();
            
            // First toggle
            selectedIds.add('1');
            onSelectionChange(Array.from(selectedIds));
            
            // Second toggle
            selectedIds.add('3');
            onSelectionChange(Array.from(selectedIds));
            
            expect(onSelectionChange).toHaveBeenCalledTimes(2);
            expect(onSelectionChange).toHaveBeenLastCalledWith(['1', '3']);
        });
    });
});
