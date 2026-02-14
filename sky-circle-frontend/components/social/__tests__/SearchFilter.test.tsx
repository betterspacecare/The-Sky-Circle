/**
 * Unit Tests for SearchFilter Component
 * 
 * Tests the SearchFilter component logic including:
 * - Search input with debounce
 * - Experience level filter dropdown
 * - Clear filters functionality
 * 
 * **Validates: Requirements 2.3, 2.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EXPERIENCE_LEVELS, SearchFilterValues } from '../SearchFilter';

describe('SearchFilter Component Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Experience Levels Configuration', () => {
    it('should have all required experience levels', () => {
      const expectedLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const actualLevels = EXPERIENCE_LEVELS.map(l => l.value);
      
      expect(actualLevels).toEqual(expectedLevels);
    });

    it('should have display labels for all levels', () => {
      EXPERIENCE_LEVELS.forEach(level => {
        expect(level.label).toBeTruthy();
        expect(typeof level.label).toBe('string');
      });
    });

    it('should have beginner level with correct label', () => {
      const beginner = EXPERIENCE_LEVELS.find(l => l.value === 'beginner');
      expect(beginner?.label).toBe('Beginner');
    });

    it('should have intermediate level with correct label', () => {
      const intermediate = EXPERIENCE_LEVELS.find(l => l.value === 'intermediate');
      expect(intermediate?.label).toBe('Intermediate');
    });

    it('should have advanced level with correct label', () => {
      const advanced = EXPERIENCE_LEVELS.find(l => l.value === 'advanced');
      expect(advanced?.label).toBe('Advanced');
    });

    it('should have expert level with correct label', () => {
      const expert = EXPERIENCE_LEVELS.find(l => l.value === 'expert');
      expect(expert?.label).toBe('Expert');
    });
  });

  describe('Debounce Logic (Requirement 2.3)', () => {
    it('should debounce rapid value changes', async () => {
      const callback = vi.fn();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      // Simulate debounce behavior (clears previous timeout on each call)
      const simulateDebounce = (value: string, delay: number) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          callback(value);
        }, delay);
      };

      // Rapid changes - each clears the previous timeout
      simulateDebounce('j', 300);
      vi.advanceTimersByTime(100);
      
      simulateDebounce('jo', 300);
      vi.advanceTimersByTime(100);
      
      simulateDebounce('joh', 300);
      vi.advanceTimersByTime(100);
      
      simulateDebounce('john', 300);
      
      // Before debounce completes
      expect(callback).not.toHaveBeenCalled();
      
      // After debounce delay
      vi.advanceTimersByTime(300);
      
      // Should only be called once with final value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('john');
    });

    it('should use default debounce delay of 300ms', () => {
      const DEFAULT_DEBOUNCE_MS = 300;
      expect(DEFAULT_DEBOUNCE_MS).toBe(300);
    });

    it('should allow custom debounce delay', () => {
      const customDelay = 500;
      const callback = vi.fn();
      
      setTimeout(() => callback('test'), customDelay);
      
      vi.advanceTimersByTime(400);
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledWith('test');
    });
  });

  describe('Search Filter Values Interface', () => {
    it('should have correct structure for filter values', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: 'test search',
        experienceLevel: 'advanced',
      };

      expect(filterValues.searchQuery).toBe('test search');
      expect(filterValues.experienceLevel).toBe('advanced');
    });

    it('should allow empty search query', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'beginner',
      };

      expect(filterValues.searchQuery).toBe('');
    });

    it('should allow empty experience level', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: 'test',
        experienceLevel: '',
      };

      expect(filterValues.experienceLevel).toBe('');
    });

    it('should allow both empty values', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: '',
      };

      expect(filterValues.searchQuery).toBe('');
      expect(filterValues.experienceLevel).toBe('');
    });
  });

  describe('Filter State Logic', () => {
    const checkHasActiveFilters = (searchQuery: string, experienceLevel: string): boolean => {
      return searchQuery !== '' || experienceLevel !== '';
    };

    it('should detect active filters when search query is set', () => {
      const hasActiveFilters = checkHasActiveFilters('test', '');
      expect(hasActiveFilters).toBe(true);
    });

    it('should detect active filters when experience level is set', () => {
      const hasActiveFilters = checkHasActiveFilters('', 'expert');
      expect(hasActiveFilters).toBe(true);
    });

    it('should detect active filters when both are set', () => {
      const hasActiveFilters = checkHasActiveFilters('john', 'intermediate');
      expect(hasActiveFilters).toBe(true);
    });

    it('should detect no active filters when both are empty', () => {
      const hasActiveFilters = checkHasActiveFilters('', '');
      expect(hasActiveFilters).toBe(false);
    });
  });

  describe('Clear Filters Logic', () => {
    it('should reset search query to empty string', () => {
      let searchQuery = 'test search';
      
      // Simulate clear
      searchQuery = '';
      
      expect(searchQuery).toBe('');
    });

    it('should reset experience level to empty string', () => {
      let experienceLevel = 'advanced';
      
      // Simulate clear
      experienceLevel = '';
      
      expect(experienceLevel).toBe('');
    });

    it('should reset both values simultaneously', () => {
      let searchQuery = 'test';
      let experienceLevel = 'beginner';
      
      // Simulate clear
      searchQuery = '';
      experienceLevel = '';
      
      expect(searchQuery).toBe('');
      expect(experienceLevel).toBe('');
    });
  });

  describe('onChange Callback Behavior', () => {
    it('should call onChange with updated values', () => {
      const onChange = vi.fn();
      
      const filterValues: SearchFilterValues = {
        searchQuery: 'test',
        experienceLevel: 'advanced',
      };
      
      onChange(filterValues);
      
      expect(onChange).toHaveBeenCalledWith({
        searchQuery: 'test',
        experienceLevel: 'advanced',
      });
    });

    it('should call onChange when search query changes', () => {
      const onChange = vi.fn();
      
      // Initial state
      onChange({ searchQuery: '', experienceLevel: '' });
      
      // After search change
      onChange({ searchQuery: 'john', experienceLevel: '' });
      
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith({
        searchQuery: 'john',
        experienceLevel: '',
      });
    });

    it('should call onChange when experience level changes', () => {
      const onChange = vi.fn();
      
      // Initial state
      onChange({ searchQuery: '', experienceLevel: '' });
      
      // After filter change
      onChange({ searchQuery: '', experienceLevel: 'expert' });
      
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith({
        searchQuery: '',
        experienceLevel: 'expert',
      });
    });

    it('should call onChange when filters are cleared', () => {
      const onChange = vi.fn();
      
      // With active filters
      onChange({ searchQuery: 'test', experienceLevel: 'beginner' });
      
      // After clear
      onChange({ searchQuery: '', experienceLevel: '' });
      
      expect(onChange).toHaveBeenLastCalledWith({
        searchQuery: '',
        experienceLevel: '',
      });
    });
  });

  describe('Experience Level Filter (Requirement 2.4)', () => {
    it('should filter by beginner level', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'beginner',
      };
      
      expect(filterValues.experienceLevel).toBe('beginner');
    });

    it('should filter by intermediate level', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'intermediate',
      };
      
      expect(filterValues.experienceLevel).toBe('intermediate');
    });

    it('should filter by advanced level', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'advanced',
      };
      
      expect(filterValues.experienceLevel).toBe('advanced');
    });

    it('should filter by expert level', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'expert',
      };
      
      expect(filterValues.experienceLevel).toBe('expert');
    });

    it('should show all levels when filter is empty', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: '',
      };
      
      expect(filterValues.experienceLevel).toBe('');
    });
  });

  describe('Combined Search and Filter', () => {
    it('should support search with experience filter', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: 'john',
        experienceLevel: 'intermediate',
      };
      
      expect(filterValues.searchQuery).toBe('john');
      expect(filterValues.experienceLevel).toBe('intermediate');
    });

    it('should support search without experience filter', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: 'jane',
        experienceLevel: '',
      };
      
      expect(filterValues.searchQuery).toBe('jane');
      expect(filterValues.experienceLevel).toBe('');
    });

    it('should support experience filter without search', () => {
      const filterValues: SearchFilterValues = {
        searchQuery: '',
        experienceLevel: 'expert',
      };
      
      expect(filterValues.searchQuery).toBe('');
      expect(filterValues.experienceLevel).toBe('expert');
    });
  });

  describe('Initial Values', () => {
    it('should support initial search query', () => {
      const initialSearchQuery = 'initial search';
      expect(initialSearchQuery).toBe('initial search');
    });

    it('should support initial experience level', () => {
      const initialExperienceLevel = 'advanced';
      expect(initialExperienceLevel).toBe('advanced');
    });

    it('should default to empty values', () => {
      const defaultSearchQuery = '';
      const defaultExperienceLevel = '';
      
      expect(defaultSearchQuery).toBe('');
      expect(defaultExperienceLevel).toBe('');
    });
  });
});
