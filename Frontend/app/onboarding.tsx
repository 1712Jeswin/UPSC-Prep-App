import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Image,
    useWindowDimensions,
    ScrollView
} from 'react-native';
import { GraduationCap, BookOpen, Newspaper, PenTool, ArrowRight, LogIn, UserPlus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NationalEmblem from '../components/icons/NationalEmblem';

export default function OnboardingScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning, Aspirant!";
        if (hour < 17) return "Good Afternoon, Aspirant!";
        return "Good Evening, Aspirant!";
    };

    useFocusEffect(
        React.useCallback(() => {
            const checkLogin = async () => {
                const loggedIn = await AsyncStorage.getItem('is_logged_in');
                if (loggedIn === 'true') {
                    router.replace('/(tabs)');
                }
            };
            checkLogin();
        }, [])
    );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
        ]).start();
    }, []);

    const handleNavigate = (path: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push(path);
    };

    const responsiveStyles: any = {
        mainContent: [
            styles.mainContent,
            { 
                flexDirection: isDesktop ? 'row' : 'column',
                alignItems: isDesktop ? 'center' : 'stretch',
                paddingHorizontal: isDesktop ? '8%' : 24,
                paddingTop: isDesktop ? 60 : 20,
            }
        ],
        heroText: [
            styles.heroText,
            { 
                flex: isDesktop ? 1.2 : 0,
                textAlign: isDesktop ? 'left' : 'center',
                alignItems: isDesktop ? 'flex-start' : 'center'
            }
        ],
        title: [
            styles.title,
            { 
                fontSize: isDesktop ? 56 : 36,
                textAlign: isDesktop ? 'left' : 'center',
                lineHeight: isDesktop ? 64 : 44
            }
        ],
        description: [
            styles.description,
            { 
                fontSize: isDesktop ? 18 : 16,
                textAlign: isDesktop ? 'left' : 'center',
                maxWidth: isDesktop ? 600 : '100%'
            }
        ],
        buttonGroup: [
            styles.buttonGroup,
            { 
                flexDirection: (isDesktop || isTablet) ? 'row' : 'column',
                width: (isDesktop || isTablet) ? 'auto' : '100%',
                gap: 16
            }
        ],
        emblemContainer: [
            styles.emblemContainer,
            { 
                display: (Platform.OS === 'web' && isDesktop) ? 'flex' : 'none',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
            }
        ],
        cardsGrid: [
            styles.cardsGrid,
            { 
                flexDirection: isDesktop ? 'row' : 'column',
                gap: 20,
                marginTop: isDesktop ? 80 : 40
            }
        ]
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={[
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
                        
                        {/* --- HERO SECTION --- */}
                        <View style={responsiveStyles.mainContent}>
                            <View style={responsiveStyles.heroText}>
                                <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
                                    <GraduationCap size={16} color={theme.primary} />
                                    <Text style={[styles.badgeText, { color: theme.primary }]}>UPSC PREP ECOSYSTEM</Text>
                                </View>
                                
                                <Text style={[responsiveStyles.title, { color: theme.text }]}>
                                    Master the UPSC Syllabus with{" "}
                                    <Text style={{ color: theme.primary }}>Ethora</Text>
                                </Text>
                                
                                <Text style={[responsiveStyles.description, { color: theme.textSecondary }]}>
                                    {getGreeting()} Your comprehensive, disciplined workspace for Daily Current Affairs, Subject Modules, and Realistic Mock Tests.
                                </Text>
    
                                <View style={responsiveStyles.buttonGroup}>
                                    <TouchableOpacity 
                                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                                        onPress={() => handleNavigate('/login')}
                                    >
                                        <LogIn size={20} color="#FFF" />
                                        <Text style={styles.primaryBtnText}>Login</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                                        onPress={() => handleNavigate('/createAccount')}
                                    >
                                        <UserPlus size={20} color={theme.text} />
                                        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Create Account</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
    
                            {/* Emblem for Web Desktop */}
                            <View style={responsiveStyles.emblemContainer}>
                                <Image
                                    source={require("../assets/images/emblem.png")}
                                    style={{
                                        width: isDesktop ? 320 : 200,
                                        height: isDesktop ? 320 : 200,
                                        tintColor: isDarkMode ? "#FFFFFF" : "#000000",
                                    }}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
    
                        {/* --- QUICK ACCESS CARDS --- */}
                        <View style={[styles.section, { paddingHorizontal: isDesktop ? '8%' : 24 }]}>
                            <View style={responsiveStyles.cardsGrid}>
                                <FeatureCard 
                                    icon={<Newspaper size={24} color={theme.primary} />}
                                    title="Current Affairs"
                                    desc="Expert analysis of daily editorials and news for UPSC."
                                    theme={theme}
                                />
                                <FeatureCard 
                                    icon={<BookOpen size={24} color={theme.primary} />}
                                    title="Syllabus Modules"
                                    desc="Structured learning paths for Polity, History, and more."
                                    theme={theme}
                                />
                                <FeatureCard 
                                    icon={<PenTool size={24} color={theme.primary} />}
                                    title="Mock Tests"
                                    desc="Test your knowledge with real-time exam simulations."
                                    theme={theme}
                                />
                            </View>
                        </View>
    
                        {/* --- FOOTER INFO --- */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                                © 2026 Ethora Learning Ecosystem. All rights reserved.
                            </Text>
                        </View>
    
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function FeatureCard({ icon, title, desc, theme }: any) {
    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.cardIcon, { backgroundColor: theme.primary + '10' }]}>
                {icon}
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{desc}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 60 },
    mainContent: {
        width: '100%',
        alignSelf: 'center',
        maxWidth: 1400,
    },
    heroText: {
        marginBottom: 40,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
        marginBottom: 24,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        fontWeight: '900',
        marginBottom: 20,
        letterSpacing: -1,
    },
    description: {
        lineHeight: 28,
        marginBottom: 40,
    },
    buttonGroup: {
        gap: 16,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 14,
        gap: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 14,
        borderWidth: 1,
        gap: 10,
    },
    secondaryBtnText: {
        fontSize: 16,
        fontWeight: '800',
    },
    emblemContainer: {
        padding: 40,
    },
    emblemImage: {
        width: 320,
        height: 320,
    },
    section: {
        marginTop: 40,
        marginBottom: 60,
    },
    cardsGrid: {
        flex: 1,
    },
    card: {
        flex: 1,
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 15,
        lineHeight: 22,
    },
    footer: {
        padding: 40,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
    }
});