/**
 * Unit Tests for Toast Store
 * 
 * Tests the toast notification store functionality including:
 * - Adding toasts
 * - Removing toasts
 * - Toast helper functions
 * 
 * **Validates: Requirements 3.1, 3.2 (error handling for follow/unfollow actions)**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore, toast } from '../toastStore';

describe('Toast Store', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    useToastStore.getState().clearToasts();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('should add a toast to the store', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ message: 'Test message', type: 'success' });
      
      const updatedToasts = useToastStore.getState().toasts;
      expect(updatedToasts).toHaveLength(1);
      expect(updatedToasts[0].message).toBe('Test message');
      expect(updatedToasts[0].type).toBe('success');
    });

    it('should generate unique IDs for each toast', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ message: 'Toast 1', type: 'success' });
      addToast({ message: 'Toast 2', type: 'error' });
      
      const toasts = useToastStore.getState().toasts;
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('should auto-remove toast after default duration', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ message: 'Auto-remove test', type: 'info' });
      
      expect(useToastStore.getState().toasts).toHaveLength(1);
      
      // Fast-forward past the default 3 second duration
      vi.advanceTimersByTime(3100);
      
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should respect custom duration', () => {
      const { addToast } = useToastStore.getState();
      
      addToast({ message: 'Custom duration', type: 'success', duration: 5000 });
      
      // After 3 seconds, toast should still be there
      vi.advanceTimersByTime(3100);
      expect(useToastStore.getState().toasts).toHaveLength(1);
      
      // After 5 seconds total, toast should be removed
      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('removeToast', () => {
    it('should remove a specific toast by ID', () => {
      const { addToast, removeToast } = useToastStore.getState();
      
      addToast({ message: 'Toast 1', type: 'success' });
      addToast({ message: 'Toast 2', type: 'error' });
      
      const toasts = useToastStore.getState().toasts;
      const toastToRemove = toasts[0];
      
      removeToast(toastToRemove.id);
      
      const updatedToasts = useToastStore.getState().toasts;
      expect(updatedToasts).toHaveLength(1);
      expect(updatedToasts[0].message).toBe('Toast 2');
    });
  });

  describe('clearToasts', () => {
    it('should remove all toasts', () => {
      const { addToast, clearToasts } = useToastStore.getState();
      
      addToast({ message: 'Toast 1', type: 'success' });
      addToast({ message: 'Toast 2', type: 'error' });
      addToast({ message: 'Toast 3', type: 'info' });
      
      expect(useToastStore.getState().toasts).toHaveLength(3);
      
      clearToasts();
      
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('toast helper functions', () => {
    it('should add success toast via helper', () => {
      toast.success('Success message');
      
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Success message');
    });

    it('should add error toast via helper', () => {
      toast.error('Error message');
      
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toBe('Error message');
    });

    it('should add info toast via helper', () => {
      toast.info('Info message');
      
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].message).toBe('Info message');
    });

    it('should support custom duration in helpers', () => {
      toast.success('Custom duration', 5000);
      
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      
      // After 3 seconds, toast should still be there
      vi.advanceTimersByTime(3100);
      expect(useToastStore.getState().toasts).toHaveLength(1);
      
      // After 5 seconds total, toast should be removed
      vi.advanceTimersByTime(2000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
