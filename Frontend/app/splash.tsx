import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    
    // Personalized Status Messages
    const [status, setStatus] = useState("Initializing Ethora...");
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Animation Sequence
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        // Logo Floating & Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -15, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();

        // Conversation Logic: Change text while loading
        const timer1 = setTimeout(() => setStatus("Organizing your desk..."), 1200);
        const timer2 = setTimeout(() => setStatus("Ready for LBSNAA?"), 2400);

        const timeout = setTimeout(() => { router.replace('/onboarding'); }, 3500);
        return () => { clearTimeout(timeout); clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                
                <View style={styles.logoContainer}>
                    <Animated.View style={[
                        styles.pulseCircle, 
                        { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }], opacity: isDarkMode ? 0.15 : 0.1 }
                    ]} />
                    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                        <BookOpen size={90} color={theme.primary} strokeWidth={1.5} />
                    </Animated.View>
                </View>

                <Text style={[styles.title, { color: isDarkMode ? theme.text : theme.primary }]}>Ethora</Text>
                
                {/* The "Talking" Text */}
                <View style={styles.statusBox}>
                    <Text style={[styles.statusText, { color: theme.textSecondary }]}>{status}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { alignItems: 'center' },
    logoContainer: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    pulseCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
    title: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
    statusBox: { marginTop: 40, height: 20 },
    statusText: { fontSize: 14, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
});