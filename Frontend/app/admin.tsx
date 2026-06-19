import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    ActivityIndicator, Platform, Alert, Dimensions, Switch
} from 'react-native';
import { ChevronLeft, Sparkles, RefreshCw, Trash2, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import GlobalHeader from '../components/GlobalHeader';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    
    // Admin configurations
    const [editionType, setEditionType] = useState<'MORNING' | 'EVENING'>('MORNING');
    const [forceDemo, setForceDemo] = useState(false);
    
    // Loaders
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const primaryTeal = theme.primary;
    const cardBg = theme.surface;
    const borderCol = theme.border;

    useEffect(() => {
        const verifyAdminRole = async () => {
            try {
                const savedData = await AsyncStorage.getItem('user_profile');
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    setUserRole(parsed.role || 'student');
                } else {
                    setUserRole('student');
                }
            } catch (error) {
                console.error(error);
                setUserRole('student');
            } finally {
                setIsLoadingRole(false);
            }
        };
        verifyAdminRole();
    }, []);

    const triggerSync = async () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSyncing(true);
        setSyncMessage(null);

        try {
            // Retrieve JWT for Backend call
            // In Better Auth setup, credentials auth saves the standard accessToken in profile or session storage
            const savedProfile = await AsyncStorage.getItem('user_profile');
            const token = savedProfile ? JSON.parse(savedProfile).accessToken || '' : '';
            
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');
            
            const response = await fetch(`${apiUrl}/admin/sync-news`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    editionType: editionType,
                    forceDemo: forceDemo
                })
            });

            const result = await response.json();

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(response.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
            }

            if (response.ok) {
                setSyncMessage(`Synced: "${result.data?.article?.title || 'Daily Current Affairs'}" is now live!`);
                if (isWeb) {
                    alert(`Successfully compiled and published the ${editionType} current affairs edition.`);
                } else {
                    Alert.alert("Success", `Successfully published the ${editionType} edition.`);
                }
            } else {
                throw new Error(result.message || "Failed to compile the daily news.");
            }
        } catch (error: any) {
            console.error(error);
            if (isWeb) {
                alert(`Error: ${error.message || 'Connection failure to sync service.'}`);
            } else {
                Alert.alert("Sync Failure", error.message || "Failed to reach daily news service.");
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const triggerCleanup = async () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsCleaning(true);

        try {
            const savedProfile = await AsyncStorage.getItem('user_profile');
            const token = savedProfile ? JSON.parse(savedProfile).accessToken || '' : '';
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');

            const response = await fetch(`${apiUrl}/admin/cleanup`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(response.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
            }

            if (response.ok) {
                if (isWeb) {
                    alert("Database cache swept and expired sessions pruned successfully.");
                } else {
                    Alert.alert("Pruning Success", "Database caches swept successfully.");
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || "Pruning failed.");
            }
        } catch (error: any) {
            console.error(error);
            if (isWeb) {
                alert(`Error: ${error.message}`);
            } else {
                Alert.alert("Cleanup Failure", error.message);
            }
        } finally {
            setIsCleaning(false);
        }
    };

    if (isLoadingRole) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={primaryTeal} />
            </View>
        );
    }

    if (userRole !== 'admin') {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 20 }} />
                <Text style={[styles.unauthorizedTitle, { color: theme.text }]}>Access Denied</Text>
                <Text style={[styles.unauthorizedDesc, { color: theme.textSecondary }]}>
                    This area is restricted to verified UPSC Platform Administrators only.
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={[styles.backBtn, { backgroundColor: primaryTeal }]}>
                    <Text style={styles.backBtnText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <GlobalHeader />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Back Link */}
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
                        <ArrowLeft size={20} color={primaryTeal} />
                    </TouchableOpacity>
                    <Text style={[styles.navBreadcrumb, { color: primaryTeal }]}>ADMINISTRATOR PORTAL</Text>
                </View>

                <Text style={[styles.mainTitle, { color: theme.text }]}>Syllabus Ingestion Control</Text>
                <Text style={[styles.subTitle, { color: theme.textSecondary }]}>
                    Automate daily current affairs digest fetching, UPSC syllabus mappings, and active quiz generations.
                </Text>

                {/* Automation Sync Card */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <View style={styles.cardHeader}>
                        <Sparkles size={20} color={primaryTeal} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>DAILY INGESTION AUTOMATION</Text>
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary }]}>CHOOSE EDITION TARGET</Text>
                    <View style={styles.segmentContainer}>
                        {(['MORNING', 'EVENING'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditionType(type);
                                }}
                                style={[
                                    styles.segmentBtn,
                                    editionType === type && { backgroundColor: primaryTeal }
                                ]}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    editionType === type ? { color: '#FFF', fontWeight: '800' } : { color: '#94A3B8' }
                                ]}>
                                    {type} EDITION
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.switchRow, { borderTopColor: borderCol, borderBottomColor: borderCol }]}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.switchTitle, { color: theme.text }]}>Enable Ingestion Sandbox</Text>
                            <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                                Enables 1-minute simulated news rotations to test UI and quizzes in real-time.
                            </Text>
                        </View>
                        <Switch
                            value={forceDemo}
                            onValueChange={setForceDemo}
                            trackColor={{ false: '#94A3B8', true: primaryTeal }}
                            thumbColor="#FFF"
                        />
                    </View>

                    {syncMessage && (
                        <View style={[styles.successBanner, { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6F7', borderColor: primaryTeal + '60' }]}>
                            <CheckCircle2 size={16} color={primaryTeal} style={{ marginRight: 8 }} />
                            <Text style={[styles.successText, { color: theme.text }]} numberOfLines={2}>
                                {syncMessage}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={triggerSync}
                        disabled={isSyncing}
                        style={[styles.syncBtn, { backgroundColor: primaryTeal }]}
                    >
                        {isSyncing ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <RefreshCw size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.syncBtnText}>Ingest and Sync Content</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Database Maintenance Card */}
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol, marginTop: 24 }]}>
                    <View style={styles.cardHeader}>
                        <Trash2 size={20} color="#EF4444" />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>DATABASE LIFECYCLE SCRUBBING</Text>
                    </View>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                        Manually trigger the Data Lifecycle Sweeper. This purges raw cached news older than 3 days, sweeps expired Better Auth user sessions, and invalidates stale browser states to prevent database storage bloat.
                    </Text>

                    <TouchableOpacity
                        onPress={triggerCleanup}
                        disabled={isCleaning}
                        style={[styles.cleanupBtn, { borderColor: '#EF4444' }]}
                    >
                        {isCleaning ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <Trash2 size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.cleanupBtnText}>Run Garbage Collector Sweep</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    unauthorizedTitle: { fontSize: 26, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
    unauthorizedDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 30, maxWidth: 320 },
    backBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    scrollContent: {
        paddingHorizontal: isWeb ? '18%' : 20,
        paddingTop: 30,
        paddingBottom: 80,
        maxWidth: isWeb ? 1600 : '100%',
        alignSelf: 'center',
        width: '100%'
    },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    backArrow: { padding: 4 },
    navBreadcrumb: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    mainTitle: { fontSize: isWeb ? 36 : 28, fontWeight: '900', letterSpacing: -1, marginBottom: 6 },
    subTitle: { fontSize: 15, lineHeight: 22, marginBottom: 40, opacity: 0.8 },

    card: { borderRadius: 24, borderWidth: 1, padding: 24 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
    cardTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
    cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 24, opacity: 0.85 },
    
    label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
    segmentContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    segmentBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF2F5', borderWidth: 1, borderColor: '#CBD5E1' },
    segmentText: { fontSize: 12, fontWeight: '700' },

    switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 24 },
    switchTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    switchDesc: { fontSize: 12, lineHeight: 16, opacity: 0.8 },

    successBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
    successText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

    syncBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    syncBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    cleanupBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1.5, backgroundColor: 'transparent' },
    cleanupBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 14 }
});
