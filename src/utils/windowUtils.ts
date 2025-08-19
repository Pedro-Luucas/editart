import { invoke } from '@tauri-apps/api/core';

export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * Resize the current window to the specified dimensions
 * @param width - New width in pixels
 * @param height - New height in pixels
 * @returns Promise that resolves when resize is complete
 */
export async function resizeWindow(width: number, height: number): Promise<void> {
  try {
    await invoke('resize_current_window', { width, height });
  } catch (error) {
    console.error('Failed to resize window:', error);
    throw error;
  }
}

/**
 * Get the current screen size
 * @returns Promise that resolves to screen dimensions
 */
export async function getScreenSize(): Promise<ScreenSize> {
  try {
    const size = await invoke<ScreenSize>('get_screen_size');
    return size;
  } catch (error) {
    console.error('Failed to get screen size:', error);
    throw error;
  }
}

/**
 * Resize window to a percentage of screen size
 * @param widthPercent - Width as percentage of screen (0-100)
 * @param heightPercent - Height as percentage of screen (0-100)
 */
export async function resizeToScreenPercentage(widthPercent: number, heightPercent: number): Promise<void> {
  try {
    const screenSize = await getScreenSize();
    const newWidth = (screenSize.width * widthPercent) / 100;
    const newHeight = (screenSize.height * heightPercent) / 100;
    await resizeWindow(newWidth, newHeight);
  } catch (error) {
    console.error('Failed to resize window to screen percentage:', error);
    throw error;
  }
}

// Common window sizes
export const WINDOW_PRESETS = {
  small: { width: 800, height: 600 },
  medium: { width: 1200, height: 800 },
  large: { width: 1600, height: 1000 },
  fullHD: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
} as const;

/**
 * Resize window to a preset size
 * @param preset - Preset size name
 */
export async function resizeToPreset(preset: keyof typeof WINDOW_PRESETS): Promise<void> {
  const { width, height } = WINDOW_PRESETS[preset];
  await resizeWindow(width, height);
}

// Screen size breakpoints for responsive sizing
export const SCREEN_BREAKPOINTS = {
  small: { max: 1366 },     // Small laptops, tablets
  medium: { min: 1367, max: 1920 },  // Standard monitors
  large: { min: 1921, max: 2560 },   // Large monitors
  xlarge: { min: 2561 },     // Ultra-wide, 4K monitors
} as const;

export type ScreenBreakpoint = keyof typeof SCREEN_BREAKPOINTS;

/**
 * Configuration for responsive window sizing
 */
export interface ResponsiveWindowConfig {
  // Strategy for sizing
  strategy: 'percentage' | 'fixed' | 'adaptive';
  
  // Minimum and maximum window dimensions
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  
  // Responsive breakpoint configurations
  breakpoints: {
    [K in ScreenBreakpoint]?: {
      width: number | string; // Can be pixels or percentage (e.g., "80%")
      height: number | string;
    };
  };
  
  // Aspect ratio constraints
  maintainAspectRatio?: boolean;
  aspectRatio?: number; // width/height ratio
}

/**
 * Default responsive configurations for common use cases
 */
export const RESPONSIVE_CONFIGS = {
  // Centered window that adapts to screen size
  centered: {
    strategy: 'percentage' as const,
    minWidth: 800,
    minHeight: 600,
    maxWidth: 1600,
    maxHeight: 1200,
    breakpoints: {
      small: { width: '90%', height: '85%' },
      medium: { width: '75%', height: '80%' },
      large: { width: '65%', height: '75%' },
      xlarge: { width: '55%', height: '70%' },
    },
  },
  
  // Sidebar layout optimized
  sidebar: {
    strategy: 'adaptive' as const,
    minWidth: 1000,
    minHeight: 700,
    aspectRatio: 16/10,
    breakpoints: {
      small: { width: '95%', height: '90%' },
      medium: { width: '80%', height: '85%' },
      large: { width: '70%', height: '80%' },
      xlarge: { width: '60%', height: '75%' },
    },
  },
  
  // Compact for small screens, spacious for large
  smart: {
    strategy: 'adaptive' as const,
    minWidth: 900,
    minHeight: 650,
    maxWidth: 1800,
    maxHeight: 1400,
    breakpoints: {
      small: { width: 1200, height: 800 },
      medium: { width: 1400, height: 900 },
      large: { width: 1600, height: 1000 },
      xlarge: { width: 1800, height: 1200 },
    },
  },
} as const;

/**
 * Detect which screen breakpoint the current screen falls into
 */
export function detectScreenBreakpoint(screenWidth: number): ScreenBreakpoint {
  if (screenWidth <= SCREEN_BREAKPOINTS.small.max) {
    return 'small';
  } else if (screenWidth <= SCREEN_BREAKPOINTS.medium.max!) {
    return 'medium';
  } else if (screenWidth <= SCREEN_BREAKPOINTS.large.max!) {
    return 'large';
  } else {
    return 'xlarge';
  }
}

/**
 * Convert percentage string to actual pixels
 */
function percentageToPixels(percentage: string, screenDimension: number): number {
  const percent = parseFloat(percentage.replace('%', ''));
  return Math.round((screenDimension * percent) / 100);
}

/**
 * Calculate optimal window dimensions based on screen size and configuration
 */
export function calculateOptimalSize(
  screenSize: ScreenSize,
  config: ResponsiveWindowConfig
): { width: number; height: number } {
  const breakpoint = detectScreenBreakpoint(screenSize.width);
  const breakpointConfig = config.breakpoints[breakpoint];
  
  if (!breakpointConfig) {
    // Fallback to medium if breakpoint not configured
    const fallbackConfig = config.breakpoints.medium || config.breakpoints.small;
    if (!fallbackConfig) {
      throw new Error('No valid breakpoint configuration found');
    }
    return calculateDimensions(screenSize, fallbackConfig, config);
  }
  
  return calculateDimensions(screenSize, breakpointConfig, config);
}

function calculateDimensions(
  screenSize: ScreenSize,
  breakpointConfig: { width: number | string; height: number | string },
  config: ResponsiveWindowConfig
): { width: number; height: number } {
  // Calculate raw dimensions
  let width = typeof breakpointConfig.width === 'string' 
    ? percentageToPixels(breakpointConfig.width, screenSize.width)
    : breakpointConfig.width;
    
  let height = typeof breakpointConfig.height === 'string'
    ? percentageToPixels(breakpointConfig.height, screenSize.height)
    : breakpointConfig.height;
  
  // Apply constraints
  if (config.minWidth) width = Math.max(width, config.minWidth);
  if (config.maxWidth) width = Math.min(width, config.maxWidth);
  if (config.minHeight) height = Math.max(height, config.minHeight);
  if (config.maxHeight) height = Math.min(height, config.maxHeight);
  
  // Apply aspect ratio if needed
  if (config.maintainAspectRatio && config.aspectRatio) {
    const currentRatio = width / height;
    if (currentRatio > config.aspectRatio) {
      // Too wide, adjust width
      width = height * config.aspectRatio;
    } else if (currentRatio < config.aspectRatio) {
      // Too tall, adjust height
      height = width / config.aspectRatio;
    }
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Resize window using responsive configuration
 */
export async function resizeWindowResponsive(
  config: ResponsiveWindowConfig | keyof typeof RESPONSIVE_CONFIGS
): Promise<{ width: number; height: number }> {
  const screenSize = await getScreenSize();
  
  // Get configuration
  const finalConfig = typeof config === 'string' 
    ? RESPONSIVE_CONFIGS[config] 
    : config;
  
  // Calculate optimal size
  const optimalSize = calculateOptimalSize(screenSize, finalConfig);
  
  // Resize window
  await resizeWindow(optimalSize.width, optimalSize.height);
  
  return optimalSize;
}
