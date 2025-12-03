import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook để quản lý localStorage với React state
 * 
 * Usage:
 * const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
 * 
 * Features:
 * - Tự động sync với localStorage
 * - Support JSON objects
 * - Error handling
 * - SSR safe
 */

const useLocalStorage = (key, initialValue) => {
  // State để lưu giá trị
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Lấy từ localStorage
      const item = window.localStorage.getItem(key);
      
      // Parse JSON nếu có, không thì trả về initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Hàm để set giá trị vào state và localStorage
  const setValue = useCallback((value) => {
    try {
      // Cho phép value là một function như useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Lưu vào state
      setStoredValue(valueToStore);
      
      // Lưu vào localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Dispatch custom event để sync giữa các tabs
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Hàm để xóa giá trị khỏi localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync giữa các tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    // Lắng nghe storage event
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

// ============================================
// UTILITY HOOKS DỰA TRÊN useLocalStorage
// ============================================

/**
 * Hook để lưu saved jobs
 */
export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs, removeSavedJobs] = useLocalStorage('savedJobs', []);

  const saveJob = useCallback((job) => {
    setSavedJobs(prev => {
      // Kiểm tra job đã được lưu chưa
      if (prev.find(j => j.id === job.id)) {
        return prev;
      }
      return [...prev, { ...job, savedAt: new Date().toISOString() }];
    });
  }, [setSavedJobs]);

  const unsaveJob = useCallback((jobId) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  }, [setSavedJobs]);

  const isJobSaved = useCallback((jobId) => {
    return savedJobs.some(job => job.id === jobId);
  }, [savedJobs]);

  const clearAllSavedJobs = useCallback(() => {
    removeSavedJobs();
  }, [removeSavedJobs]);

  return {
    savedJobs,
    saveJob,
    unsaveJob,
    isJobSaved,
    clearAllSavedJobs
  };
};

/**
 * Hook để lưu search history
 */
export const useSearchHistory = (maxItems = 10) => {
  const [searchHistory, setSearchHistory, clearHistory] = useLocalStorage('searchHistory', []);

  const addSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return;

    setSearchHistory(prev => {
      // Xóa term cũ nếu đã tồn tại
      const filtered = prev.filter(term => term !== searchTerm);
      
      // Thêm term mới vào đầu
      const updated = [searchTerm, ...filtered];
      
      // Giới hạn số lượng
      return updated.slice(0, maxItems);
    });
  }, [setSearchHistory, maxItems]);

  const removeSearch = useCallback((searchTerm) => {
    setSearchHistory(prev => prev.filter(term => term !== searchTerm));
  }, [setSearchHistory]);

  return {
    searchHistory,
    addSearch,
    removeSearch,
    clearHistory
  };
};

/**
 * Hook để lưu user preferences
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('userPreferences', {
    theme: 'light',
    language: 'vi',
    notifications: true,
    emailAlerts: false,
    jobAlerts: false
  });

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  }, [setPreferences]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    clearPreferences
  };
};

/**
 * Hook để lưu form draft
 */
export const useFormDraft = (formKey) => {
  const [draft, setDraft, clearDraft] = useLocalStorage(`formDraft_${formKey}`, null);

  const saveDraft = useCallback((formData) => {
    setDraft({
      data: formData,
      savedAt: new Date().toISOString()
    });
  }, [setDraft]);

  const getDraft = useCallback(() => {
    return draft?.data || null;
  }, [draft]);

  const hasDraft = useCallback(() => {
    return draft !== null;
  }, [draft]);

  return {
    draft: draft?.data || null,
    savedAt: draft?.savedAt || null,
    saveDraft,
    getDraft,
    hasDraft,
    clearDraft
  };
};

/**
 * Hook để lưu recent views (jobs đã xem gần đây)
 */
export const useRecentViews = (maxItems = 5) => {
  const [recentViews, setRecentViews, clearRecentViews] = useLocalStorage('recentViews', []);

  const addView = useCallback((job) => {
    setRecentViews(prev => {
      // Xóa job cũ nếu đã tồn tại
      const filtered = prev.filter(j => j.id !== job.id);
      
      // Thêm job mới vào đầu
      const updated = [{
        ...job,
        viewedAt: new Date().toISOString()
      }, ...filtered];
      
      // Giới hạn số lượng
      return updated.slice(0, maxItems);
    });
  }, [setRecentViews, maxItems]);

  const removeView = useCallback((jobId) => {
    setRecentViews(prev => prev.filter(job => job.id !== jobId));
  }, [setRecentViews]);

  return {
    recentViews,
    addView,
    removeView,
    clearRecentViews
  };
};

export default useLocalStorage;