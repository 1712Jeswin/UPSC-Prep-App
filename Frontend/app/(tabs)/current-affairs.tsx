import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, ChevronLeft, BookOpen, Layers, CheckCircle2, Sparkles, Award } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const isWeb = Platform.OS === 'web';

type GSCategory = 'ALL' | 'GS_I' | 'GS_II' | 'GS_III';

const CATEGORIES = [
    { id: 'ALL' as GSCategory, title: 'All Papers' },
    { id: 'GS_I' as GSCategory, title: 'GS I (Heritage/Geo)' },
    { id: 'GS_II' as GSCategory, title: 'GS II (Polity/IR)' },
    { id: 'GS_III' as GSCategory, title: 'GS III (Econ/Env/S&T)' },
];

export default function CurrentAffairs() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const navigation = useNavigation();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Dynamic states
    const [articles, setArticles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<GSCategory>('ALL');
    const [completedArticles, setCompletedArticles] = useState<string[]>([]);

    // Dynamic brand color
    const primaryTeal = theme.primary;
    const cardBorder = theme.border;

    // Safe API Url resolver
    const getApiUrl = () => {
        return process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');
    };

    // Fetch live articles from Neon DB
    const fetchLiveArticles = async () => {
        try {
            setIsLoading(true);
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/articles`);
            const result = await response.json();
            if (result.success && result.data) {
                setArticles(result.data);
            }
        } catch (error) {
            console.log("Failed to fetch live articles.", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load completed articles from local cache
    const checkReadProgress = async () => {
        try {
            const saved = await AsyncStorage.getItem('user_completed_articles');
            if (saved) {
                setCompletedArticles(JSON.parse(saved));
            } else {
                setCompletedArticles([]);
            }
        } catch (e) {
            console.error("Error reading progress:", e);
        }
    };

    useEffect(() => {
        fetchLiveArticles();
        checkReadProgress();
    }, []);

    // Recheck progress on mount and screen focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            checkReadProgress();
        });
        return unsubscribe;
    }, [navigation]);

    const handlePress = (articleId: string, articleTitle: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push({
            pathname: "/editorial-analyst",
            params: { id: articleId, title: articleTitle }
        });
    };

    // Intelligent keyword-based tag classifier to resolve syllabus categorization mismatch
    const getPaperCategory = (syllabusTag: string): GSCategory => {
        const tag = (syllabusTag || '').toUpperCase();
        
        // 1. Direct tag matches - STRICT ORDER SPECIFICATION TO PREVENT COLLISION (III -> II -> I)
        if (tag.includes('GS III') || tag.includes('GS-3') || tag.includes('GS3') || tag.includes('GENERAL STUDIES III') || tag.includes('GENERAL STUDIES-3')) {
            return 'GS_III';
        }
        if (tag.includes('GS II') || tag.includes('GS-2') || tag.includes('GS2') || tag.includes('GENERAL STUDIES II') || tag.includes('GENERAL STUDIES-2')) {
            return 'GS_II';
        }
        if (tag.includes('GS I') || tag.includes('GS-1') || tag.includes('GS1') || tag.includes('GENERAL STUDIES I') || tag.includes('GENERAL STUDIES-1')) {
            return 'GS_I';
        }

        // 2. Fuzzy checks based on subject-related keywords
        const gs1Keywords = ['HISTORY', 'HISTORICAL', 'CULTURE', 'CULTURAL', 'GEOGRAPHY', 'GEOGRAPHICAL', 'HERITAGE', 'SOCIETY', 'SOCIAL ISSUES'];
        const gs2Keywords = ['POLITY', 'POLITICAL', 'GOVERNANCE', 'CONSTITUTION', 'CONSTITUTIONAL', 'INTERNATIONAL RELATION', 'IR', 'JUDICIARY', 'JUDICIAL', 'PARLIAMENT', 'LEGISLATIVE', 'ADMINISTRATIVE', 'SCHEME'];
        const gs3Keywords = ['ECONOMY', 'ECONOMIC', 'ENVIRONMENT', 'ENVIRONMENTAL', 'ECOLOGY', 'SCIENCE', 'TECH', 'S&T', 'TECHNOLOGY', 'INFRASTRUCTURE', 'DISASTER', 'SECURITY', 'DEFENCE', 'AGRICULTURE', 'BUDGET', 'FINANCIAL'];

        if (gs1Keywords.some(kw => tag.includes(kw))) return 'GS_I';
        if (gs2Keywords.some(kw => tag.includes(kw))) return 'GS_II';
        if (gs3Keywords.some(kw => tag.includes(kw))) return 'GS_III';

        return 'ALL'; // Fallback
    };

    // Filter articles based on selected GS Paper category
    const filteredArticles = articles.filter(article => {
        if (activeCategory === 'ALL') return true;
        const mappedCat = getPaperCategory(article.syllabusTag);
        return mappedCat === activeCategory;
    });

    const formatPublishedDate = (dateStr: string) => {
        if (!dateStr) return 'TODAY';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    };

    const getPaperShortBadge = (tagStr: string) => {
        const cat = getPaperCategory(tagStr);
        if (cat === 'GS_I') return 'GS I';
        if (cat === 'GS_II') return 'GS II';
        if (cat === 'GS_III') return 'GS III';
        return 'GS GENERAL';
    };

    // Calculate Completion Ratios for Target Bar
    const completedCount = articles.filter(a => completedArticles.includes(a.id)).length;
    const progressPercent = articles.length > 0 ? Math.round((completedCount / articles.length) * 100) : 0;
    
    // Core Gating: Cumulative quiz unlocks if feed has articles and ALL are completed
    const allArticlesRead = articles.length > 0 && articles.every(a => completedArticles.includes(a.id));

    const handleStartRecallQuiz = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        // Redirect to quiz screen in cumulative recall mode passing today's complete article list
        router.push({
            pathname: '/quiz',
            params: { articleIds: articles.map(a => a.id).join(',') }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <SafeAreaView edges={['bottom']} style={styles.mainWrapper}>

                    {/* Top Header */}
                    <View style={[styles.topSection, { flexDirection: 'row', alignItems: 'center' }]}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                                <ChevronLeft size={32} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }}>
                            <MotiText
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                style={[styles.headerTitle, { color: theme.text }]}
                            >
                                UPSC Editorial Analyst
                            </MotiText>
                            <MotiText
                                from={{ opacity: 0, translateY: 10 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ delay: 100 }}
                                style={[styles.subTitle, { color: theme.textSecondary }]}
                            >
                                Unified, premium distraction-free news reading with cumulative UPSC recall quizzes.
                            </MotiText>
                        </View>
                    </View>

                    {/* General Studies horizontal selector */}
                    <View style={styles.segmentWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => {
                                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveCategory(cat.id);
                                    }}
                                    style={[
                                        styles.categoryBtn,
                                        { borderColor: cardBorder },
                                        activeCategory === cat.id && { backgroundColor: primaryTeal, borderColor: primaryTeal }
                                    ]}
                                >
                                    <Text style={[
                                        styles.categoryBtnText,
                                        { color: theme.textSecondary },
                                        activeCategory === cat.id && { color: '#FFF', fontWeight: '800' }
                                    ]}>
                                        {cat.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.layoutBody}>
                        
                        {/* Daily Progress Goal Tracker */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 200 }}
                            style={[styles.sideCard, { backgroundColor: isDarkMode ? '#1E293B' : '#2D5A61', borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }]}
                        >
                            <Text style={styles.sideTitleWhite}>Aspirant Daily Progress</Text>
                            <View style={styles.progressBarBg}>
                                <MotiView
                                    from={{ width: '0%' }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ type: 'timing', duration: 800 }}
                                    style={[styles.progressBarFill, { backgroundColor: isDarkMode ? primaryTeal : '#FFF' }]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {articles.length > 0 
                                    ? `Analyzed: ${completedCount} of ${articles.length} news items (${progressPercent}%). Mark all articles as completed to unlock today's cumulative Recall Quiz.`
                                    : "Curate today's news edition via the curator panel to sync live study content."
                                }
                            </Text>
                        </MotiView>

                        {/* Cumulative Quiz floating/popup Banner */}
                        {allArticlesRead && (
                            <MotiView
                                from={{ opacity: 0, translateY: 20, scale: 0.95 }}
                                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                                transition={{ type: 'spring', delay: 100 }}
                                style={[styles.recallBanner, { backgroundColor: isDarkMode ? '#10B98115' : '#D1FAE5', borderColor: '#10B981' }]}
                            >
                                <View style={styles.recallBannerLeft}>
                                    <Sparkles size={24} color="#10B981" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.recallBannerTitle, { color: isDarkMode ? '#FFF' : '#065F46' }]}>Daily Recall Quiz Ready!</Text>
                                        <Text style={[styles.recallBannerSubtitle, { color: isDarkMode ? '#A7F3D0' : '#047857' }]}>You have completed all of today's editorials. Test your retention now.</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleStartRecallQuiz} style={styles.recallBannerBtn}>
                                    <Award size={16} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.recallBannerBtnText}>Click Recall</Text>
                                </TouchableOpacity>
                            </MotiView>
                        )}

                        {/* Classified feed */}
                        <View style={styles.mainContent}>
                            {isLoading ? (
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator size="large" color={primaryTeal} />
                                    <Text style={{ color: theme.textSecondary, marginTop: 12, fontWeight: '600' }}>Loading live news feed...</Text>
                                </View>
                            ) : filteredArticles.length > 0 ? (
                                filteredArticles.map((item, index) => {
                                    const isRead = completedArticles.includes(item.id);
                                    return (
                                        <MotiView
                                            key={item.id}
                                            from={{ opacity: 0, translateY: 20 }}
                                            animate={{ opacity: 1, translateY: 0 }}
                                            transition={{ delay: 100 + (index * 100) }}
                                        >
                                            <TouchableOpacity
                                                activeOpacity={0.9}
                                                onPress={() => handlePress(item.id, item.title)}
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
                                                {/* GS category left visual Block */}
                                                <View style={[styles.imageBox, { backgroundColor: primaryTeal + '15', borderColor: primaryTeal + '30', borderWidth: 1 }]}>
                                                    <Layers size={24} color={primaryTeal} />
                                                    <Text style={[styles.swatchText, { color: primaryTeal }]}>{getPaperShortBadge(item.syllabusTag)}</Text>
                                                </View>
 
                                                <View style={styles.cardContent}>
                                                    <View style={styles.cardHeader}>
                                                        <Text 
                                                            style={[styles.tagText, { color: primaryTeal, flex: 1, marginRight: 8 }]} 
                                                            numberOfLines={1}
                                                        >
                                                            {item.syllabusTag || 'GENERAL STUDIES'}  •  {formatPublishedDate(item.publishedDate)}
                                                        </Text>
                                                        {isRead && (
                                                            <View style={styles.readBadge}>
                                                                <CheckCircle2 size={10} color="#10B981" />
                                                                <Text style={styles.readBadgeText}>READ</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={[styles.newsTitle, { color: theme.text }]} numberOfLines={2}>
                                                        {item.title}
                                                    </Text>
                                                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 6 }} numberOfLines={2}>
                                                        {item.summary}
                                                    </Text>
                                                    <View style={styles.cardFooter}>
                                                        <Text style={[styles.sourceText, { color: theme.textSecondary }]}>LATEST LIVE CA DIGEST</Text>
                                                        <View style={styles.analyzeBtn}>
                                                            <Text style={[styles.analyzeText, { color: primaryTeal }]}>Read news</Text>
                                                            <ChevronRight size={14} color={primaryTeal} />
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </MotiView>
                                    );
                                })
                            ) : (
                                <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: cardBorder }]}>
                                    <BookOpen size={48} color={primaryTeal} style={{ opacity: 0.6, marginBottom: 16 }} />
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No Curated news Today</Text>
                                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                        There are no compiled news items in this category yet. Click News Sync on the dashboard to fetch today's Morning edition.
                                    </Text>
                                    <TouchableOpacity onPress={fetchLiveArticles} style={[styles.retryBtn, { backgroundColor: primaryTeal }]}>
                                        <Text style={styles.retryBtnText}>Refresh Feed</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
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
    topSection: { marginBottom: 20 },
    headerTitle: { fontSize: Platform.OS === 'web' ? 36 : 28, fontWeight: '900', letterSpacing: -0.5 },
    subTitle: { fontSize: 15, marginTop: 6, lineHeight: 22, opacity: 0.8 },
    
    // Paper filter segment
    segmentWrapper: { marginBottom: 25 },
    categoryScroll: { gap: 10, paddingVertical: 4 },
    categoryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginRight: 8, backgroundColor: 'transparent' },
    categoryBtnText: { fontSize: 13, fontWeight: '700' },

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
    imageBox: { width: isMobile ? 80 : 96, height: isMobile ? 80 : 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 },
    swatchText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    cardContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    tagText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    readBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98115', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    readBadgeText: { color: '#10B981', fontSize: 9, fontWeight: '800' },
    newsTitle: { fontSize: isMobile ? 15 : 17, fontWeight: '800', lineHeight: isMobile ? 20 : 24 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    sourceText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    analyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    analyzeText: { fontSize: 12, fontWeight: '800' },
    sideCard: { padding: 24, borderRadius: 24, gap: 12, marginBottom: 5 },
    sideTitleWhite: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 10 },
    progressText: { color: '#FFF', fontSize: 13, opacity: 0.9, fontWeight: '500', lineHeight: 18 },

    // Click Recall Quiz Banner styles
    recallBanner: {
        borderWidth: 1.5,
        borderRadius: 24,
        padding: 20,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 10
    },
    recallBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    recallBannerTitle: { fontSize: 16, fontWeight: '900' },
    recallBannerSubtitle: { fontSize: 12, lineHeight: 18, fontWeight: '600', marginTop: 2 },
    recallBannerBtn: {
        backgroundColor: '#10B981',
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
        width: isMobile ? '100%' : 'auto'
    },
    recallBannerBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    loaderContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyCard: { padding: 40, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, maxWidth: 300, marginBottom: 20 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28 },
    retryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' }
});