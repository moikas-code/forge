/**
 * Layout Components Export Index
 * 
 * Central export point for all layout-related components in Forge MOI.
 * This provides a clean import interface for other parts of the application.
 */

// Core layout components
export { AppLayout } from './AppLayout';
export { Sidebar } from './Sidebar';
export { TabManager } from './TabManager';

// Error boundary components for robust layout handling
export { TabErrorBoundary } from './TabErrorBoundary';
export { ComponentErrorBoundary } from './ComponentErrorBoundary';

// Type exports for layout system
export type { Tab, LayoutState } from '@/stores/layoutStore';

// Re-export commonly used layout hooks
export { useLayoutStore } from '@/stores/layoutStore';