import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, Dimensions, Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Zap, ChevronLeft, Landmark, Globe, TrendingUp, Hourglass, Calculator, HeartHandshake, X, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { MotiView } from 'moti';


const isWeb = Platform.OS === 'web';

// Custom Hook to animate numbers up from 0
const useAnimatedValue = (targetValue: number, duration: number = 1500, isK: boolean = false) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        let animationId: number;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOutProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(easeOutProgress * targetValue));

            if (progress < 1) {
                animationId = requestAnimationFrame(step);
            }
        };

        animationId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationId);
    }, [targetValue, duration]);

    return isK ? `${(count / 1000).toFixed(1)}k` : count.toString();
};

const SUBJECTS = [
    { id: '1', name: 'Indian Polity', questions: '1200 Questions', progress: 0.80, progressText: '80% Complete', icon: Landmark, status: 'Resume Practice' },
    { id: '2', name: 'Geography', questions: '950 Questions', progress: 0.45, progressText: '45% Complete', icon: Globe, status: 'Resume Practice' },
    { id: '3', name: 'Economics', questions: '800 Questions', progress: 0.10, progressText: '10% Complete', icon: TrendingUp, status: 'Resume Practice' },
    { id: '4', name: 'History', questions: '1100 Questions', progress: 0.60, progressText: '60% Complete', icon: Hourglass, status: 'Resume Practice' },
    { id: '5', name: 'Aptitude', questions: '1500 Questions', progress: 0.25, progressText: '25% Complete', icon: Calculator, status: 'Resume Practice' },
    { id: '6', name: 'Ethics', questions: '700 Questions', progress: 0, progressText: '0% Complete', icon: HeartHandshake, status: 'Start Learning' },
];

const stats = [
    { label: 'ACCURACY', target: 84, suffix: '%', isK: false, trend: '↑ 2%' },
    { label: 'SOLVED', target: 1200, suffix: '', isK: true, trend: '↑ 150' },
    { label: 'STREAK', target: 12, suffix: '', isK: false, trend: '↑ 3' }
];

const StatCard = ({ stat, delay, theme, cardBg, borderCol }: any) => {
    const value = useAnimatedValue(stat.target, 1500, stat.isK);
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            style={[styles.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}
        >
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: theme.text }]}>{value}{stat.suffix}</Text>
                <Text style={styles.statTrendUp}>{stat.trend}</Text>
            </View>
        </MotiView>
    );
};

export default function PracticeScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [activeTest, setActiveTest] = useState<any | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const primaryTeal = theme.primary;
    const cardBg = theme.surface;
    const borderCol = theme.border;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Using Global Header as per your instructions */}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header (Web Back Button Only) */}
                {Platform.OS === 'web' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                            <ChevronLeft size={32} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Practice</Text>
                    </View>
                )}

                <View style={styles.statsContainer}>
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} stat={stat} delay={idx * 100} theme={theme} cardBg={cardBg} borderCol={borderCol} />
                    ))}
                </View>

                {/* Grid with Hover Effects */}
                <View style={styles.grid}>
                    {SUBJECTS.map((item, index) => (
                        <MotiView
                            key={item.id}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{
                                opacity: 1,
                                translateY: 0,
                                // Smooth scale hover effect for web
                                scale: isWeb && hoveredId === item.id ? 1.03 : 1
                            }}
                            transition={{ delay: index * 50, type: 'timing', duration: 400 }}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                {...(isWeb ? {
                                    onMouseEnter: () => setHoveredId(item.id),
                                    onMouseLeave: () => setHoveredId(null),
                                } : {})}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveTest(item);
                                }}
                                style={[
                                    styles.cardContainer,
                                    { backgroundColor: cardBg, borderColor: borderCol },
                                    isWeb && hoveredId === item.id && styles.cardHoverShadow
                                ]}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.cardTop}>
                                        <View style={[styles.iconBox, { backgroundColor: theme.surfaceAlt }]}>
                                            <item.icon size={22} color={primaryTeal} />
                                        </View>
                                        <Text style={[styles.cardSubjectName, { color: theme.text }]}>{item.name}</Text>
                                    </View>
                                    <View style={styles.cardMetaRow}>
                                        <Text style={[styles.cardQsCount, { color: theme.textSecondary }]}>{item.questions}</Text>
                                        <Text style={[styles.cardProgressPercent, { color: primaryTeal }]}>{item.progressText}</Text>
                                    </View>

                                    <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                                        <MotiView
                                            from={{ width: '0%' }}
                                            animate={{ width: `${item.progress * 100}%` }}
                                            transition={{ type: 'timing', duration: 1000, delay: 500 }}
                                            style={[styles.progressBarFill, { backgroundColor: primaryTeal }]}
                                        />
                                    </View>

                                    <View style={[styles.actionButton, { backgroundColor: item.status === 'Start Learning' ? 'transparent' : primaryTeal, borderColor: primaryTeal, borderWidth: item.status === 'Start Learning' ? 1.5 : 0 }]}>
                                        <Text style={[styles.actionButtonText, { color: item.status === 'Start Learning' ? primaryTeal : '#FFF' }]}>{item.status}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </MotiView>
                    ))}
                </View>
            </ScrollView>

            {/* FULL-SCREEN MOCK TEST MODAL */}
            <Modal
                visible={!!activeTest}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setActiveTest(null)}
            >
                <View style={[styles.modalContainer, { backgroundColor: cardBg }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <TouchableOpacity onPress={() => setActiveTest(null)} style={styles.closeBtn}>
                            <X size={28} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{activeTest ? `${activeTest.name} Mock Test` : ""}</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <View style={styles.questionCard}>
                            <Text style={[styles.questionLabel, { color: primaryTeal }]}>QUESTION 1 OF 15</Text>
                            <Text style={[styles.questionText, { color: theme.text }]}>{`Consider the following statements regarding the Governor of a State in India:

1. The Governor is appointed by the President by warrant under his hand and seal.
2. The Governor holds office during the pleasure of the President.

Which of the statements given above is/are correct?`}</Text>

                            <View style={styles.optionsList}>
                                {['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'].map((opt, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedOption(i)}
                                        style={[
                                            styles.optionBtn,
                                            {
                                                borderColor: selectedOption === i ? primaryTeal : (isDarkMode ? '#334155' : '#E2E8F0'),
                                                backgroundColor: selectedOption === i ? (isDarkMode ? '#1E293B' : '#F0F9FA') : (isDarkMode ? '#0F172A' : '#F8FAFC')
                                            }
                                        ]}
                                    >
                                        <View style={[
                                            styles.optionRadio,
                                            {
                                                borderColor: selectedOption === i ? primaryTeal : (isDarkMode ? '#64748B' : '#94A3B8'),
                                                borderWidth: selectedOption === i ? 6 : 2
                                            }
                                        ]} />
                                        <Text style={[styles.optionText, { color: theme.text, fontWeight: selectedOption === i ? '700' : '600' }]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.modalFooter, { borderTopColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: cardBg }]}>
                        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: primaryTeal }]}>
                            <Text style={styles.nextBtnText}>Next Question</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
    statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 40, flexWrap: 'wrap' },
    headerTitle: { fontSize: isWeb ? 36 : 28, fontWeight: '900', letterSpacing: -0.5 },
    statCard: { flex: 1, minWidth: isWeb ? 200 : '45%', padding: 20, borderRadius: 16, borderWidth: 1 },
    statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    statValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
    statValue: { fontSize: 24, fontWeight: '900' },
    statTrendUp: { fontSize: 12, fontWeight: '700', color: '#10B981' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    cardWrapper: { width: isWeb ? '31%' : '100%' },
    cardContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', ...(isWeb ? { transitionProperty: 'all', transitionDuration: '0.2s' } as any : {}) },
    cardHoverShadow: {
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 20px rgba(0,0,0,0.1)',
                transform: 'translateY(-5px)'
            }
        })
    } as any,
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardSubjectName: { fontSize: 18, fontWeight: '800' },
    cardContent: { padding: 24 },
    cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    cardQsCount: { fontSize: 12, fontWeight: '600' },
    cardProgressPercent: { fontSize: 12, fontWeight: '800' },
    progressBarBg: { height: 6, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    actionButton: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    actionButtonText: { fontSize: 13, fontWeight: '800' },

    // Modal Styles
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    closeBtn: { padding: 4 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalBody: { flex: 1, padding: 24, maxWidth: 800, alignSelf: 'center', width: '100%' },
    questionCard: { marginBottom: 40 },
    questionLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
    questionText: { fontSize: 18, lineHeight: 28, fontWeight: '600', marginBottom: 32 },
    optionsList: { gap: 16 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1.5, gap: 16 },
    optionRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
    optionText: { fontSize: 16, fontWeight: '600', flex: 1 },
    modalFooter: { padding: 24, borderTopWidth: 1, alignItems: 'center' },
    nextBtn: { width: '100%', maxWidth: 400, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});