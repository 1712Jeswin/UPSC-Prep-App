export const lightTheme = {
    primary: '#3B6F7D', 
    primaryLight: '#5A8E9C',
    primaryDark: '#2D5561',

    accent: '#0D2B44', 
    accentLight: '#1A3A5A',

    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceAlt: '#F3F4F6',

    text: '#0D2B44',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    textLight: '#FFFFFF',

    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    success: '#22C55E',
    warning: '#FBBF24',
    error: '#EF4444',

    tabActive: '#3B6F7D',
    tabInactive: '#6B7280',

    cardShadow: 'rgba(13, 43, 68, 0.1)',
};

export const darkTheme = {
    primary: '#5A8E9C', // Slightly brighter teal for dark mode
    primaryLight: '#7BAFBD',
    primaryDark: '#3B6F7D',

    accent: '#1E293B', 
    accentLight: '#334155',

    // Deep Navy/Slate background for that premium dark look
    background: '#0F172A', 
    surface: '#1E293B',    // Cards in dark mode
    surfaceAlt: '#334155',

    text: '#F8FAFC',       // Near-white text
    textSecondary: '#94A3B8', 
    textTertiary: '#64748B',
    textLight: '#FFFFFF',

    border: '#334155',
    borderLight: '#1E293B',

    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',

    tabActive: '#FFFFFF',  // White active tab as we discussed
    tabInactive: '#64748B',

    cardShadow: 'rgba(0, 0, 0, 0.3)',
};

// Default export to avoid breaking existing imports if necessary
const colors = lightTheme;
export default colors;