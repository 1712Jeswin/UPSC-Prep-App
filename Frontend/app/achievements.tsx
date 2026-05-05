import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Award, Target, Star, Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import GlobalHeader from '@/components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

const ACHIEVEMENTS = [
    { id: 1, title: 'Early Bird', desc: 'Login before 6 AM', icon: <Flame size={isMobile ? 22 : 28} color="#FF8C00" />, color: '#FFF4E6', progress: 0.6, totalText: '3/5', tier: 'COMMON' },
    { id: 2, title: 'Polity King', desc: '50 Correct Answers', icon: <Award size={isMobile ? 22 : 28} color="#6366F1" />, color: '#EEF2FF', progress: 0.84, totalText: '42/50', tier: 'RARE' },
    { id: 3, title: 'Streak 10', desc: '10 Day Study Streak', icon: <Target size={isMobile ? 22 : 28} color="#10B981" />, color: '#ECFDF5', progress: 1.0, totalText: '10/10', tier: 'EPIC' },
    { id: 4, title: 'Top Scorer', desc: 'Rank #1 in Mock', icon: <Star size={isMobile ? 22 : 28} color="#F59E0B" />, color: '#FFFBEB', progress: 0.0, totalText: '0/1', tier: 'LEGEND' },
];

export default function AchievementScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const primaryTeal = '#4A767D';

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F9FBFC' }]}>
            <GlobalHeader />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                <View style={s.mobileCenterWrapper}>
                    
                    {/* Navigation Row */}
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={20} color={theme.text} />
                        <Text style={[s.sectionTag, { color: theme.text }]}>Achievements</Text>
                    </TouchableOpacity>

                    {/* Level Progress Card */}
                    <Animated.View 
                        entering={FadeInDown.duration(600)} 
                        style={[s.levelCard, { backgroundColor: theme.surface, flexDirection: isMobile ? 'column' : 'row' }]}
                    >
                        <View style={s.levelInfo}>
                            <Text style={[s.levelTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>Aspirant Level 4</Text>
                            <Text style={[s.xpSubtitle, { color: theme.textSecondary }]}>1,250 / 2,000 XP to Level 5</Text>
                            
                            <View style={s.overallProgressContainer}>
                                <View style={s.progressRow}>
                                    <Text style={s.progressLabel}>Progress</Text>
                                    <Text style={s.progressPercent}>62%</Text>
                                </View>
                                <View style={s.masterTrack}>
                                    <View style={[s.masterBar, { width: '62%', backgroundColor: primaryTeal }]} />
                                </View>
                            </View>
                        </View>
                        <View style={[s.xpBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6F7', marginTop: isMobile ? 20 : 0 }]}>
                            <Text style={[s.xpBadgeText, { color: primaryTeal }]}>750 XP Left</Text>
                        </View>
                    </Animated.View>

                    {/* Section Header */}
                    <View style={s.sectionHeaderRow}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Collection</Text>
                        <TouchableOpacity><Text style={s.viewAllLink}>View All</Text></TouchableOpacity>
                    </View>

                    {/* Grid Section - 2 columns on mobile */}
                    <View style={s.grid}>
                        {ACHIEVEMENTS.map((item, index) => (
                            <Animated.View 
                                key={item.id} 
                                entering={FadeInDown.delay(index * 100)}
                                style={[s.badgeCard, { backgroundColor: theme.surface, width: isMobile ? '47%' : '31%' }]}
                            >
                                <View style={s.cardTop}>
                                    <View style={[s.iconBox, { backgroundColor: item.color, width: isMobile ? 40 : 56, height: isMobile ? 40 : 56 }]}>
                                        {item.icon}
                                    </View>
                                </View>

                                <Text style={[s.badgeTitle, { color: theme.text, fontSize: isMobile ? 14 : 18 }]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={[s.badgeDesc, { color: theme.textSecondary, fontSize: isMobile ? 11 : 14 }]} numberOfLines={2}>
                                    {item.desc}
                                </Text>

                                <View style={s.cardFooter}>
                                    <View style={s.footerMeta}>
                                        <Text style={s.metaVal}>{item.totalText}</Text>
                                    </View>
                                    <View style={s.miniTrack}>
                                        <View style={[
                                            s.miniBar, 
                                            { 
                                                width: `${item.progress * 100}%`, 
                                                backgroundColor: item.tier === 'EPIC' ? '#10B981' : item.tier === 'RARE' ? '#6366F1' : '#F97316' 
                                            }
                                        ]} />
                                    </View>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
    mobileCenterWrapper: {
        width: isMobile ? '92%' : '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        paddingTop: isMobile ? 15 : 30
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTag: { fontSize: 14, fontWeight: '800', marginLeft: 6, opacity: 0.8 },

    levelCard: { 
        borderRadius: 20, 
        padding: isMobile ? 20 : 30, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 }
        })
    },
    levelInfo: { flex: 1, width: '100%' },
    levelTitle: { fontWeight: '900', marginBottom: 4 },
    xpSubtitle: { fontSize: 14, marginBottom: 15 },
    overallProgressContainer: { width: '100%' },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    progressPercent: { fontSize: 12, fontWeight: '800' },
    masterTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    masterBar: { height: '100%', borderRadius: 4 },
    xpBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
    xpBadgeText: { fontWeight: '800', fontSize: 12 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '900' },
    viewAllLink: { color: '#4A767D', fontWeight: '800', fontSize: 14 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? 12 : 20 },
    badgeCard: { 
        padding: isMobile ? 16 : 24, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
    },
    cardTop: { marginBottom: 12 },
    iconBox: { borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    badgeTitle: { fontWeight: '800', marginBottom: 4 },
    badgeDesc: { lineHeight: isMobile ? 16 : 20, marginBottom: 15, height: isMobile ? 32 : 40 },
    cardFooter: { marginTop: 'auto' },
    footerMeta: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    metaVal: { fontSize: 10, fontWeight: '900', color: '#4A767D' },
    miniTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
    miniBar: { height: '100%', borderRadius: 2 },
});