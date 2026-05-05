import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../constants/colors';

// Define the shape of our context
type ThemeContextType = {
  theme: typeof lightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = '@user_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load the saved theme from AsyncStorage (Works on Mobile & Web LocalStorage)
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (e) {
        console.warn("Failed to load theme preference:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedTheme();
  }, []);

  // 2. WEB ONLY: Update the browser body style to match the theme
  // This prevents white flickering or borders on large screens
  useEffect(() => {
    if (Platform.OS === 'web' && !isLoading) {
      const activeTheme = isDarkMode ? darkTheme : lightTheme;
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = activeTheme.background;
        document.body.style.transition = 'background-color 0.3s ease'; // Smooth transition
      }
    }
  }, [isDarkMode, isLoading]);

  // 3. Toggle logic with persistence
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Prevent UI flash during initial storage read
  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};