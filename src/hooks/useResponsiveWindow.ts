import { useEffect, useCallback, useState } from 'react';
import { 
  resizeWindowResponsive, 
  RESPONSIVE_CONFIGS, 
  ResponsiveWindowConfig,
  getScreenSize,
  detectScreenBreakpoint,
  ScreenBreakpoint,
  ScreenSize
} from '../utils/windowUtils';

export interface UseResponsiveWindowOptions {
  // Configuration to use
  config: ResponsiveWindowConfig | keyof typeof RESPONSIVE_CONFIGS;
  
  // When to trigger resize
  resizeOn?: 'mount' | 'never' | 'manual';
  
  // Delay before resizing (useful to avoid rapid resizes)
  debounceMs?: number;
  
  // Callback when resize completes
  onResize?: (dimensions: { width: number; height: number }) => void;
  
  // Callback when resize fails
  onError?: (error: any) => void;
}

export interface UseResponsiveWindowReturn {
  // Current window state
  isResizing: boolean;
  currentBreakpoint: ScreenBreakpoint | null;
  screenSize: ScreenSize | null;
  lastResizeDimensions: { width: number; height: number } | null;
  
  // Actions
  resize: () => Promise<void>;
  
  // Utils
  getOptimalSize: () => Promise<{ width: number; height: number } | null>;
}

/**
 * Hook for responsive window sizing
 * Automatically handles different screen sizes and provides utilities for window management
 */
export function useResponsiveWindow(options: UseResponsiveWindowOptions): UseResponsiveWindowReturn {
  const [isResizing, setIsResizing] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<ScreenBreakpoint | null>(null);
  const [screenSize, setScreenSize] = useState<ScreenSize | null>(null);
  const [lastResizeDimensions, setLastResizeDimensions] = useState<{ width: number; height: number } | null>(null);

  // Debounced resize function
  const resize = useCallback(async () => {
    if (isResizing) return; // Prevent concurrent resizes
    
    setIsResizing(true);
    
    try {
      const dimensions = await resizeWindowResponsive(options.config);
      setLastResizeDimensions(dimensions);
      options.onResize?.(dimensions);
    } catch (error) {
      console.error('Failed to resize window:', error);
      options.onError?.(error);
    } finally {
      setIsResizing(false);
    }
  }, [options.config, options.onResize, options.onError, isResizing]);

  // Get optimal size without resizing
  const getOptimalSize = useCallback(async () => {
    try {
      const currentScreenSize = await getScreenSize();
      const config = typeof options.config === 'string' 
        ? RESPONSIVE_CONFIGS[options.config] 
        : options.config;
      
      const breakpoint = detectScreenBreakpoint(currentScreenSize.width);
      const breakpointConfig = config.breakpoints[breakpoint];
      
      if (!breakpointConfig) return null;
      
      // Simple calculation for preview
      let width = typeof breakpointConfig.width === 'string'
        ? Math.round((currentScreenSize.width * parseFloat(breakpointConfig.width.replace('%', ''))) / 100)
        : breakpointConfig.width;
        
      let height = typeof breakpointConfig.height === 'string'
        ? Math.round((currentScreenSize.height * parseFloat(breakpointConfig.height.replace('%', ''))) / 100)
        : breakpointConfig.height;
      
      return { width, height };
    } catch (error) {
      console.error('Failed to get optimal size:', error);
      return null;
    }
  }, [options.config]);

  // Update screen size and breakpoint
  const updateScreenInfo = useCallback(async () => {
    try {
      const size = await getScreenSize();
      setScreenSize(size);
      setCurrentBreakpoint(detectScreenBreakpoint(size.width));
    } catch (error) {
      console.error('Failed to get screen size:', error);
    }
  }, []);

  // Auto-resize on mount if configured
  useEffect(() => {
    updateScreenInfo();
    
    if (options.resizeOn === 'mount') {
      const timer = setTimeout(() => {
        resize();
      }, options.debounceMs || 100);
      
      return () => clearTimeout(timer);
    }
  }, [options.resizeOn, options.debounceMs, resize, updateScreenInfo]);

  return {
    isResizing,
    currentBreakpoint,
    screenSize,
    lastResizeDimensions,
    resize,
    getOptimalSize,
  };
}

/**
 * Simpler hook for one-time window sizing on app startup
 */
export function useAutoResize(
  config: ResponsiveWindowConfig | keyof typeof RESPONSIVE_CONFIGS,
  enabled: boolean = true
) {
  const [hasResized, setHasResized] = useState(false);
  
  useEffect(() => {
    if (!enabled || hasResized) return;
    
    const doResize = async () => {
      try {
        await resizeWindowResponsive(config);
        setHasResized(true);
        console.log('Window auto-resized successfully');
      } catch (error) {
        console.error('Auto-resize failed:', error);
      }
    };
    
    // Small delay to ensure window is ready
    const timer = setTimeout(doResize, 150);
    return () => clearTimeout(timer);
  }, [config, enabled, hasResized]);
  
  return hasResized;
}
