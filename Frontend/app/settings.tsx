import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Platform,
    Alert,
    Share,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Lock,
    Database,
    FileText,
    Trash2,
    EyeOff,
    Moon,
    Sun,
    ChevronLeft
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import GlobalHeader from '@/components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

export default function SettingsScreen() {
    const router = useRouter();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const [incognitoMode, setIncognitoMode] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedIncognito = await AsyncStorage.getItem('incognito_mode');
                if (savedIncognito !== null) setIncognitoMode(JSON.parse(savedIncognito));
            } catch (e) { console.error(e); }
        };
        loadSettings();
    }, []);

    const handleIncognitoToggle = async (value: boolean) => {
        setIncognitoMode(value);
        await AsyncStorage.setItem('incognito_mode', JSON.stringify(value));
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // UI Component for Settings Row
    const SettingRow = ({ icon: Icon, label, sublabel, onPress, rightElement }: any) => (
        <TouchableOpacity
            style={[s.row, { backgroundColor: theme.surface, borderColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={s.rowLeft}>
                <View style={[s.iconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                    <Icon size={20} color={isDarkMode ? '#94A3B8' : '#475569'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[s.rowLabel, { color: theme.text }]}>{label}</Text>
                    {sublabel && <Text style={[s.rowSublabel, { color: theme.textTertiary }]}>{sublabel}</Text>}
                </View>
            </View>
            {rightElement ? rightElement : <ChevronRight size={18} color="#94A3B8" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
            <GlobalHeader />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                <View style={s.mobileWrapper}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
                                <ChevronLeft size={28} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <Text style={[s.pageTitle, { color: theme.text, marginBottom: 0 }]}>Settings</Text>
                    </View>

                    <Text style={[s.sectionHeader, { color: theme.textSecondary }]}>Security & Privacy</Text>
                    <View style={s.sectionGroup}>
                        <SettingRow
                            icon={Lock}
                            label="Change Password"
                            onPress={() => router.push('/settings/changePassword')}
                        />
                        <SettingRow
                            icon={EyeOff}
                            label="Incognito Study Mode"
                            sublabel="Hide active status from peers"
                            rightElement={
                                <Switch
                                    value={incognitoMode}
                                    onValueChange={handleIncognitoToggle}
                                    trackColor={{ false: '#CBD5E1', true: '#4A767D' }}
                                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
                                />
                            }
                        />
                    </View>

                    <Text style={[s.sectionHeader, { color: theme.textSecondary }]}>Data & Legal</Text>
                    <View style={s.sectionGroup}>
                        <SettingRow icon={Database} label="Backup Progress" onPress={() => { }} />
                        <SettingRow icon={FileText} label="Terms of Service" onPress={() => { }} />
                        <SettingRow icon={Trash2} label="Clear Cache" onPress={() => { }} />
                    </View>

                    <Text style={[s.sectionHeader, { color: theme.textSecondary }]}>Appearance</Text>
                    <View style={s.sectionGroup}>
                        <SettingRow
                            icon={isDarkMode ? Moon : Sun}
                            label="Dark Mode"
                            rightElement={
                                <Switch
                                    value={isDarkMode}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#CBD5E1', true: '#4A767D' }}
                                />
                            }
                        />
                    </View>

                    <View style={[s.footerContainer, { borderTopColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <Text style={s.footerText}>Ethora v1.0.0 • 2026</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    mobileWrapper: {
        width: '100%',
        maxWidth: 1100,
        alignSelf: 'center',
        paddingHorizontal: Platform.OS === 'web' ? '5%' : 20,
        paddingTop: 30,
    },
    pageTitle: { fontSize: Platform.OS === 'web' ? 36 : 28, fontWeight: '900', marginBottom: 25 },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4
    },
    sectionGroup: { marginBottom: 28, gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rowLabel: { fontSize: 16, fontWeight: '700' },
    rowSublabel: { fontSize: 12, marginTop: 1, fontWeight: '500' },
    footerContainer: { marginTop: 20, alignItems: 'center', borderTopWidth: 1, paddingTop: 30 },
    footerText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' }
});