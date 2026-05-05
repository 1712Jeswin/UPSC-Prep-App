import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const DAILY_NEWS = [
    { id: '1', tag: 'GS II • POLITY', title: 'New Bill on Digital Data Protection: Impact on Privacy Rights', source: 'The Hindu', date: '15 Oct 2023', imageColor: '#2D5A6140' },
    { id: '2', tag: 'GS III • ECONOMY', title: 'Understanding the Periodic Labour Force Survey Trends', source: 'Indian Express', date: '14 Oct 2023', imageColor: '#E8F3F130' },
    { id: '3', tag: 'GS II • IR', title: 'India-Middle East-Europe Corridor: A Strategic Masterstroke?', source: 'LiveMint', date: '14 Oct 2023', imageColor: '#F4F7F630' },
    { id: '4', tag: 'GS III • ENV', title: 'Carbon Border Adjustment Mechanism: Implications for India', source: 'The Hindu', date: '13 Oct 2023', imageColor: '#E2E8F030' }
];

export default function CurrentAffairs() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Dynamic brand color that adjusts brightness for readability
    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';
    const cardBorder = isDarkMode ? '#334155' : '#E2E8F0'; // Darkened from EDF2F7 to match learn.tsx visibility

    const handlePress = (id: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push({ pathname: "/editorial-analyst", params: { id } });
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView edges={['bottom']} style={styles.mainWrapper}>

                    <View style={[styles.topSection, { flexDirection: 'row', alignItems: 'center' }]}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                                <ChevronLeft size={32} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <View>
                            <MotiText
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                style={[styles.headerTitle, { color: theme.text }]}
                            >
                                Daily Current Affairs
                            </MotiText>
                            <MotiText
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ delay: 100 }}
                                style={[styles.subTitle, { color: theme.textSecondary }]}
                            >
                                Comprehensive news analysis curated daily for UPSC aspirants.
                            </MotiText>
                        </View>
                    </View>

                    <View style={styles.layoutBody}>
                        {/* Progress Card: Uses brand color but adjusts for Dark Mode depth */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 200 }}
                            style={[styles.sideCard, { backgroundColor: isDarkMode ? '#1E293B' : '#2D5A61', borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }]}
                        >
                            <Text style={styles.sideTitleWhite}>Daily Progress</Text>
                            <View style={styles.progressBarBg}>
                                <MotiView
                                    from={{ width: '0%' }}
                                    animate={{ width: '60%' }}
                                    transition={{ type: 'timing', duration: 1000, delay: 500 }}
                                    style={[styles.progressBarFill, { backgroundColor: isDarkMode ? primaryTeal : '#FFF' }]}
                                />
                            </View>
                            <Text style={styles.progressText}>Read 2 more articles to hit your daily goal.</Text>
                        </MotiView>

                        <View style={styles.mainContent}>
                            {DAILY_NEWS.map((item, index) => (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateY: 20 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ delay: 300 + (index * 100) }}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => handlePress(item.id)}
                                        {...(Platform.OS === 'web' ? {
                                            onMouseEnter: () => setHoveredId(item.id),
                                            onMouseLeave: () => setHoveredId(null)
                                        } : {} as any)}
                                        style={[
                                            styles.newsCard,
                                            {
                                                backgroundColor: theme.surface,
                                                borderColor: hoveredId === item.id ? primaryTeal : cardBorder
                                            },
                                            Platform.OS === 'web' && hoveredId === item.id && {
                                                boxShadow: `0 8px 20px -6px ${primaryTeal}40`,
                                                transform: [{ translateY: -4 }]
                                            }
                                        ]}
                                    >
                                        <View style={[styles.imageBox, { backgroundColor: item.imageColor }]} />
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardHeader}>
                                                <Text style={[styles.tagText, { color: primaryTeal }]}>{item.tag}  •  {item.date}</Text>
                                            </View>
                                            <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>
                                                {item.title}
                                            </Text>
                                            <View style={styles.cardFooter}>
                                                <Text style={[styles.sourceText, { color: theme.textSecondary }]}>{item.source}</Text>
                                                <View style={styles.analyzeBtn}>
                                                    <Text style={[styles.analyzeText, { color: primaryTeal }]}>Analyze</Text>
                                                    <ChevronRight size={14} color={primaryTeal} />
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </View>
                    </View>
                </SafeAreaView>
            </ScrollView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    mainWrapper: {
        paddingHorizontal: Platform.OS === 'web' ? '5%' : 20,
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
        paddingTop: 30
    },
    topSection: { marginBottom: 30 },
    headerTitle: { fontSize: Platform.OS === 'web' ? 36 : 28, fontWeight: '900', letterSpacing: -0.5 },
    subTitle: { fontSize: 15, marginTop: 6, lineHeight: 22, opacity: 0.8 },
    layoutBody: { flexDirection: 'column', gap: 20 },
    mainContent: { flex: 1 },
    newsCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        marginBottom: 16,
        ...Platform.select({
            web: { transition: 'all 0.25s ease' },
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    imageBox: { width: isMobile ? 70 : 90, height: isMobile ? 70 : 90, borderRadius: 12 },
    cardContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    cardHeader: { marginBottom: 4 },
    tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    newsTitle: { fontSize: isMobile ? 15 : 18, fontWeight: '700', lineHeight: isMobile ? 20 : 24 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    sourceText: { fontSize: 11, fontWeight: '600' },
    analyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    analyzeText: { fontSize: 12, fontWeight: '800' },
    sideCard: { padding: 24, borderRadius: 24, gap: 12, marginBottom: 10 },
    sideTitleWhite: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 10 },
    progressText: { color: '#FFF', fontSize: 13, opacity: 0.9, fontWeight: '500' }
});