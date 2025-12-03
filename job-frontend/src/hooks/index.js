/**
 * Central export file for all custom hooks
 * 
 * Usage:
 * import { useAuth, useJobs, useLocalStorage } from './hooks';
 */

// Main hooks
export { default as useAuth } from './useAuth';
export { default as useJobs } from './useJobs';
export { default as useLocalStorage } from './useLocalStorage';

// Utility hooks from useLocalStorage
export {
  useSavedJobs,
  useSearchHistory,
  useUserPreferences,
  useFormDraft,
  useRecentViews
} from './useLocalStorage';