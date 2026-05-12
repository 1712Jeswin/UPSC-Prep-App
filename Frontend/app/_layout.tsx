import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
  require('react-native-url-polyfill/auto');
  const { ReadableStream } = require('web-streams-polyfill');

  if (typeof (global as any).ReadableStream === 'undefined') {
    (global as any).ReadableStream = ReadableStream;
  }
}

import '../global.css';
import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../context/ThemeContext'; 

function RootLayoutContent() {
    const { isDarkMode, theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            
            <Stack
                initialRouteName="splash"
                screenOptions={{
                    headerShown: false,
                    // 3. Stack background now matches the theme
                    contentStyle: { backgroundColor: theme.background }
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="splash" options={{ headerShown: false }} />
                {/* 4. Added settings to stack if it wasn't there */}
                <Stack.Screen name="settings" options={{ headerShown: false }} />
            </Stack>
        </View>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RootLayoutContent />
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Removed the static background here so it can be dynamic above
        // paddingBottom: 20, 
    },
}); 