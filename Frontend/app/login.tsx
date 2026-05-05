import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
    Alert, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const isMobile = width < 450;
const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export default function LoginScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { theme, isDarkMode } = useTheme();
    const brandColor = theme.primary;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();
    }, []);


    const handleLogin = async () => {
        if (!email.trim() || !password) {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Missing Info", "Fill in both fields!");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();
            if (result.success) {
                await AsyncStorage.setItem('accessToken', result.data.accessToken);
                router.replace('/(tabs)');
            } else {
                Alert.alert("Login Failed", result.message || "Invalid credentials");
            }
        } catch (error) {
            Alert.alert("Error", "Network request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View style={[
                        s.card,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            padding: isMobile ? 24 : 45,
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                        }
                    ]}>
                        <Text style={[s.cardTitle, { fontSize: isMobile ? 24 : 32, color: theme.text }]}>Welcome Back</Text>
                        <Text style={[s.cardSubtitle, { color: theme.textSecondary }]}>Sign in to your workspace</Text>

                        <View style={s.form}>
                            <Text style={[s.label, { color: theme.text }]}>Email Address</Text>
                            <View style={[s.inputWrap, { height: isMobile ? 50 : 56, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                                <Mail size={16} color={theme.textTertiary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[s.input, { color: theme.text }]}
                                    placeholder="name@company.com"
                                    placeholderTextColor={theme.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                    editable={!loading}
                                />
                            </View>

                            <View style={s.passwordHeader}>
                                <Text style={[s.label, { color: theme.text }]}>Password</Text>
                                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                    <Text style={[s.forgotText, { color: brandColor }]}>Forgot?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[s.inputWrap, { height: isMobile ? 50 : 56, marginBottom: 20, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                                <Lock size={16} color={theme.textTertiary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[s.input, { color: theme.text }]}
                                    placeholder="••••••••"
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor={theme.textTertiary}
                                    autoCorrect={false}
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} color={brandColor} /> : <Eye size={18} color={theme.textTertiary} />}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[s.signInBtn, { backgroundColor: brandColor, height: isMobile ? 50 : 56 }]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.signInBtnText}>Sign In</Text>}
                            </TouchableOpacity>
                        </View>

                        <View style={s.dividerRow}>
                            <View style={[s.line, { backgroundColor: theme.border }]} /><Text style={[s.dividerText, { color: theme.textTertiary }]}>OR</Text><View style={[s.line, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={s.socialRow}>
                            {['apple', 'facebook'].map((platform, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[s.socialBtn, { height: isMobile ? 48 : 52, borderColor: theme.border }]}
                                    onPress={() => null}
                                >
                                    {platform === 'apple' && <Svg width="18" height="18" viewBox="0 0 256 315"><Path d="M213.803 167.03c.442 47.83 41.74 63.884 42.18 64.084-.353.995-6.55 22.526-21.505 44.413-12.923 18.914-26.324 37.738-47.465 38.126-20.764.387-27.426-12.286-51.193-12.286-23.766 0-31.147 12.067-50.806 12.833-20.376.765-35.343-20.302-48.373-39.284-26.662-38.834-47.07-109.68-19.458-157.72 13.713-23.834 38.25-38.966 64.733-39.354 20.376-.387 39.542 13.684 52.006 13.684 12.464 0 35.635-16.924 60.18-14.413 10.28.43 39.14 4.14 57.653 31.258-1.492.93-34.406 20.063-34.06 60.203M174.455 42.152C183.74 30.932 189.982 15.347 188.256 0c-13.16.53-29.073 8.76-38.508 19.824-8.46 9.77-15.86 25.61-13.88 40.71 14.673 1.142 29.53-7.258 38.587-18.382" fill={isDarkMode ? "#FFF" : "#000"} /></Svg>}
                                    {platform === 'facebook' && <Svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><Path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 11.91v-8.43H7.08v-3.48h3.04V9.41c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.96h-1.51c-1.49 0-1.95.92-1.95 1.87v2.24h3.33l-.53 3.48h-2.8v8.43C19.59 23.09 24 18.1 24 12.07z" /></Svg>}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.footer}>
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>New here? </Text>
                            <TouchableOpacity onPress={() => router.push('/createAccount')}>
                                <Text style={{ color: brandColor, fontWeight: '700', fontSize: 13 }}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Text style={[s.copyright, { color: theme.textTertiary }]}>© 2026 Digital Systems</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // This centers the card vertically
        alignItems: 'center',
        paddingVertical: 20
    },
    card: {
        width: isMobile ? '90%' : '100%',
        maxWidth: 480,
        borderRadius: isMobile ? 24 : 32,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
            android: { elevation: 6 },
            web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.04)' }
        })
    },
    cardTitle: { fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
    cardSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 25 },
    form: { width: '100%' },
    label: { fontSize: 11, fontWeight: '800', marginBottom: 6, marginLeft: 2, textTransform: 'uppercase' },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 12
    },
    input: { flex: 1, fontSize: 15 },
    passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    forgotText: { fontSize: 11, fontWeight: '700' },
    signInBtn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    signInBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1 },
    dividerText: { fontSize: 10, fontWeight: '800', marginHorizontal: 12 },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
    socialBtn: {
        flex: 1, borderRadius: 12, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center'
    },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    copyright: { fontSize: 10, fontWeight: '600', marginTop: 20 }
});