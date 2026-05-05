import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Switch, 
    Platform,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, BookOpen, MessageSquare, Trophy, Zap, Info, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import GlobalHeader from '@/components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

export default function NotificationsScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [dailyMocks, setDailyMocks] = useState(true);
    const [studyReminders, setStudyReminders] = useState(true);
    const [doubtDiscussions, setDoubtDiscussions] = useState(false);
    const [milestones, setMilestones] = useState(true);

    const primaryTeal = '#4A767D';

    const SettingCard = ({ icon: Icon, title, subtitle, value, onToggle }: any) => (
        <View style={[s.sectionCard, { backgroundColor: theme.surface, padding: isMobile ? 16 : 24 }]}>
            <View style={s.cardInner}>
                <View style={[s.iconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                    <Icon size={isMobile ? 18 : 20} color={primaryTeal} />
                </View>
                <View style={s.textSide}>
                    <Text style={[s.cardTitle, { color: theme.text, fontSize: isMobile ? 15 : 16 }]}>{title}</Text>
                    <Text style={[s.cardSubtitle, { color: theme.textSecondary, fontSize: isMobile ? 12 : 14 }]}>{subtitle}</Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#CBD5E1', true: primaryTeal }}
                    thumbColor="#FFFFFF"
                    style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {}}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F9FBFC' }]}>
            <GlobalHeader />

            <ScrollView 
                contentContainerStyle={s.scrollContent} 
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={s.mobileCenterWrapper}>
                    {/* Header Row */}
                    <View style={s.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <ChevronLeft size={isMobile ? 24 : 28} color={theme.text} />
                        </TouchableOpacity>
                        <View style={s.titleContainer}>
                            <Text style={[s.title, { color: theme.text, fontSize: isMobile ? 28 : 36 }]}>Notifications</Text>
                            <Text style={[s.subtitle, { color: theme.textSecondary }]}>
                                Manage your updates and alerts.
                            </Text>
                        </View>
                    </View>

                    {/* Section: Push */}
                    <View style={s.groupHeader}>
                        <Zap size={14} color={primaryTeal} />
                        <Text style={[s.groupTitle, { color: primaryTeal }]}>PUSH NOTIFICATIONS</Text>
                    </View>

                    <View style={[s.sectionCard, { backgroundColor: theme.surface, padding: isMobile ? 16 : 24 }]}>
                        <View style={s.cardInner}>
                            <View style={s.textSide}>
                                <Text style={[s.cardTitle, { color: theme.text, fontSize: isMobile ? 15 : 16 }]}>Enable Push Notifications</Text>
                                <Text style={[s.cardSubtitle, { color: theme.textSecondary, fontSize: isMobile ? 12 : 14 }]}>
                                    Real-time browser and app alerts
                                </Text>
                            </View>
                            <Switch
                                value={pushEnabled}
                                onValueChange={setPushEnabled}
                                trackColor={{ false: '#CBD5E1', true: primaryTeal }}
                                thumbColor="#FFFFFF"
                                style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {}}
                            />
                        </View>
                    </View>

                    {/* Section: Activity */}
                    <View style={s.groupHeader}>
                        <Bell size={14} color={primaryTeal} />
                        <Text style={[s.groupTitle, { color: primaryTeal }]}>ACTIVITY PREFERENCES</Text>
                    </View>

                    <SettingCard icon={Bell} title="Daily Mock Tests" subtitle="New daily mocks alerts" value={dailyMocks} onToggle={setDailyMocks} />
                    <SettingCard icon={BookOpen} title="Study Reminders" subtitle="Personalized schedule nudges" value={studyReminders} onToggle={setStudyReminders} />
                    <SettingCard icon={MessageSquare} title="Doubt Discussions" subtitle="Replies to your queries" value={doubtDiscussions} onToggle={setDoubtDiscussions} />
                    <SettingCard icon={Trophy} title="Milestones" subtitle="Celebrations and certificates" value={milestones} onToggle={setMilestones} />

                    {/* Save Button */}
                    <TouchableOpacity 
                        style={[s.saveBtn, { backgroundColor: primaryTeal, height: isMobile ? 50 : 56 }]}
                        onPress={() => router.back()}
                    >
                        <Text style={s.saveBtnText}>Save Preferences</Text>
                    </TouchableOpacity>

                    {/* Info Box */}
                    <View style={[s.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6F7' }]}>
                        <Info size={16} color={primaryTeal} style={{ marginRight: 10 }} />
                        <Text style={[s.infoText, { color: theme.textSecondary }]}>
                            Settings are synced across devices. System settings may override these.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        flexGrow: 1,
        paddingBottom: 40,
    },
    mobileCenterWrapper: {
        width: isMobile ? '92%' : '100%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingTop: isMobile ? 20 : 40,
    },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: isMobile ? 25 : 40,
        gap: 10
    },
    backBtn: { marginTop: 4, padding: 4 },
    titleContainer: { flex: 1 },
    title: { fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 14, marginTop: 4, opacity: 0.7 },

    groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8, marginLeft: 4 },
    groupTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    sectionCard: { 
        borderRadius: 16, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
            android: { elevation: 2 },
        })
    },
    cardInner: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textSide: { flex: 1, paddingRight: 10 },
    cardTitle: { fontWeight: '700', marginBottom: 2 },
    cardSubtitle: { lineHeight: 18 },

    saveBtn: { 
        width: '100%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 25
    },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },

    infoBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#D1E2E4',
    },
    infoText: { flex: 1, fontSize: 12, lineHeight: 16 }
});