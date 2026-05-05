import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Target, BarChart2, Zap, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';

// Simple Custom Hook/Component to animate numbers up from 0
const AnimatedCounter = ({ targetValue, duration = 1500, suffix = '', isK = false }: { targetValue: number, duration?: number, suffix?: string, isK?: boolean }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Ease-out expo function for a smooth counting effect
            const easeOutProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = Math.floor(easeOutProgress * targetValue);

            setCount(currentVal);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [targetValue, duration]);

    const displayValue = isK ? `${(count / 1000).toFixed(1)}k` : count.toString();
    return <Text>{displayValue}{suffix}</Text>;
};

export default function SyllabusTracker() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();

    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const borderCol = isDarkMode ? '#334155' : '#E2E8F0';

    // BACKEND DEV: Data matches the visual breakdown in image_242cc6.png
    const syllabusData = [
        { subject: 'Polity', progress: 85, color: theme.primary, subtitle: 'CONSTITUTIONAL FRAMEWORK & GOVERNANCE' },
        { subject: 'Economy', progress: 40, color: theme.primary, subtitle: 'MACROECONOMICS & INDIAN FINANCIAL SYSTEM' },
        { subject: 'Environment', progress: 15, color: theme.primary, subtitle: 'ECOLOGY, BIODIVERSITY & CLIMATE CHANGE' },
        { subject: 'History', progress: 60, color: theme.primary, subtitle: 'MODERN INDIAN HISTORY & CULTURE' },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <View style={[styles.header, { flexDirection: 'row', alignItems: 'center' }]}>
                {Platform.OS === 'web' && (
                    <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                        <ChevronLeft size={32} color={theme.text} />
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your journey to LBSNAA in numbers</Text>
                </View>
            </View>

            {/* Stats Grid - Responsive spacing */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <View style={styles.iconCircle}>
                        <Trophy size={18} color={theme.primary} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Articles Read</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}><AnimatedCounter targetValue={124} /></Text>
                    <Text style={styles.trendText}>↗ +12% from last week</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <View style={styles.iconCircle}>
                        <Target size={18} color={theme.primary} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recall Rate</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}><AnimatedCounter targetValue={92} suffix="%" /></Text>
                    <Text style={styles.successText}>● Above average target</Text>
                </View>
            </View>

            {/* Subject-wise Breakdown Card */}
            <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.chartHeader}>
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Subject-wise Breakdown</Text>
                    <Text style={styles.viewDetailed}>View detailed report</Text>
                </View>

                {syllabusData.map((item, index) => (
                    <View key={index} style={styles.progressItem}>
                        <View style={styles.progressLabelRow}>
                            <Text style={[styles.subjectText, { color: theme.text }]}>{item.subject}</Text>
                            <Text style={[styles.percentText, { color: theme.text }]}>{item.progress}%</Text>
                        </View>

                        <View style={[styles.progressTrack, { backgroundColor: theme.border + '20' }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { backgroundColor: item.color, width: `${item.progress}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.subjectSubtitle}>{item.subtitle}</Text>
                    </View>
                ))}
            </View>


        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: isWeb ? '5%' : 20,
        paddingTop: 30,
        paddingBottom: 100,
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%'
    },
    header: { marginBottom: 30 },
    title: { fontSize: isWeb ? 36 : 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, lineHeight: 22, marginTop: 6, opacity: 0.8 },

    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 30
    },
    statCard: {
        flex: 1,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    statLabel: { fontSize: 13, fontWeight: '600' },
    statValue: { fontSize: 28, fontWeight: '800', marginVertical: 2 },
    trendText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
    successText: { fontSize: 11, fontWeight: '700', color: '#059669' },

    chartCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    chartTitle: { fontSize: 18, fontWeight: '800' },
    viewDetailed: { fontSize: 12, fontWeight: '700', color: '#64748B' },

    progressItem: { marginBottom: 24 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    subjectText: { fontSize: 15, fontWeight: '800' },
    percentText: { fontSize: 14, fontWeight: '700', opacity: 0.8 },
    progressTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 6 },
    subjectSubtitle: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }
});