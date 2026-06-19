import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { BookOpen, ArrowLeft, CheckCircle2, Bookmark, Calendar, Clock, Award } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlobalHeader from '../components/GlobalHeader'; 
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const isWeb = Platform.OS === 'web';

const mockData = {
    readingTime: "5 MINS"
};

// Smart recursive JSON and bullet points parser for perfect scannable content rendering
const renderExamFocusContent = (content: string, theme: any, primaryTeal: string) => {
    if (!content) return <Text style={[styles.sectionBodyText, { color: theme.textSecondary }]}>No scannable exam highlights generated.</Text>;
    
    let cleanText = content.trim();
    
    const parseJSON = (str: string) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    };

    let parsed = parseJSON(cleanText);
    
    // Attempt parsing again if double stringified (frequent in raw model caching)
    if (typeof parsed === 'string') {
        parsed = parseJSON(parsed);
    }

    // Case 1: Array of Heading/Points objects
    if (Array.isArray(parsed)) {
        return parsed.map((item: any, idx: number) => (
            <View key={idx} style={styles.contentGroup}>
                {item.heading && <Text style={[styles.contentHeading, { color: theme.text }]}>{item.heading}</Text>}
                {Array.isArray(item.points) && item.points.map((pt: string, pIdx: number) => (
                    <View key={pIdx} style={styles.bulletRow}>
                        <Text style={[styles.bulletSymbol, { color: primaryTeal }]}>•</Text>
                        <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{pt}</Text>
                    </View>
                ))}
            </View>
        ));
    }

    // Case 2: Single Heading/Points object or generic map
    if (parsed && typeof parsed === 'object') {
        if (parsed.heading || parsed.points) {
            return (
                <View style={styles.contentGroup}>
                    {parsed.heading && <Text style={[styles.contentHeading, { color: theme.text }]}>{parsed.heading}</Text>}
                    {Array.isArray(parsed.points) && parsed.points.map((pt: string, pIdx: number) => (
                        <View key={pIdx} style={styles.bulletRow}>
                            <Text style={[styles.bulletSymbol, { color: primaryTeal }]}>•</Text>
                            <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{pt}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        return Object.keys(parsed).map((key, idx) => {
            const val = parsed[key];
            return (
                <View key={idx} style={styles.contentGroup}>
                    <Text style={[styles.contentHeading, { color: theme.text }]}>{key}</Text>
                    {Array.isArray(val) ? (
                        val.map((pt: string, pIdx: number) => (
                            <View key={pIdx} style={styles.bulletRow}>
                                <Text style={[styles.bulletSymbol, { color: primaryTeal }]}>•</Text>
                                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{pt}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.bulletRow}>
                            <Text style={[styles.bulletSymbol, { color: primaryTeal }]}>•</Text>
                            <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{String(val)}</Text>
                        </View>
                    )}
                </View>
            );
        });
    }

    // Case 3: Raw text fallback (strip escape characters and generate bullets cleanly)
    const lines = cleanText
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    return (
        <View style={styles.contentGroup}>
            {lines.map((line, idx) => {
                const cleanLine = line.replace(/^[\s*\-•\d.]+\s*/, '');
                return (
                    <View key={idx} style={styles.bulletRow}>
                        <Text style={[styles.bulletSymbol, { color: primaryTeal }]}>•</Text>
                        <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{cleanLine}</Text>
                    </View>
                );
            })}
        </View>
    );
};

export default function EditorialAnalyst() {
    const { theme, isDarkMode } = useTheme();
    const { id, title } = useLocalSearchParams();
    const router = useRouter();
    
    // Live Article & Completion States
    const [article, setArticle] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    const primaryTeal = theme.primary;
    const cardBg = theme.surface;
    const borderCol = theme.border;

    // Safe resolver for backend API
    const getApiUrl = () => {
        return process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');
    };

    useEffect(() => {
        const loadArticleAndProgress = async () => {
            try {
                setIsLoading(true);
                // 1. Fetch live article from Neon DB
                const apiUrl = getApiUrl();
                const response = await fetch(`${apiUrl}/articles/${id}`);
                
                if (!response.ok) {
                    throw new Error("Unable to retrieve live article details.");
                }
                const result = await response.json();
                if (result.success && result.data) {
                    setArticle(result.data);
                }

                // 2. Check if already marked as read
                const saved = await AsyncStorage.getItem('user_completed_articles');
                if (saved) {
                    const completedIds = JSON.parse(saved);
                    if (Array.isArray(completedIds) && completedIds.includes(id)) {
                        setIsCompleted(true);
                    }
                }
            } catch (error) {
                console.error("Error loading article detailed view:", error);
                Alert.alert("Load Failure", "Failed to retrieve this article from the server.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadArticleAndProgress();
        }
    }, [id]);

    const toggleCompleted = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        
        try {
            const saved = await AsyncStorage.getItem('user_completed_articles');
            let completedIds = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(completedIds)) {
                completedIds = [];
            }

            let nextState = !isCompleted;
            if (nextState) {
                if (!completedIds.includes(id)) {
                    completedIds.push(id);
                }
            } else {
                completedIds = completedIds.filter((item: string) => item !== id);
            }

            await AsyncStorage.setItem('user_completed_articles', JSON.stringify(completedIds));
            setIsCompleted(nextState);
        } catch (e) {
            console.error("Failed to persist reading progress:", e);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={primaryTeal} />
                <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 12 }]}>Loading Curated Study Guide...</Text>
            </View>
        );
    }

    const formatPublishedDate = (dateStr: string) => {
        if (!dateStr) return 'TODAY';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toUpperCase();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <GlobalHeader />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Back Button & Breadcrumbs */}
                <View style={styles.headerNavRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={primaryTeal} />
                    </TouchableOpacity>
                    <Text style={[styles.breadcrumbText, { color: primaryTeal }]}>
                        {article?.syllabusTag || "DAILY CURATED NEWS"}
                    </Text>
                </View>

                {/* News Article Title */}
                <Text style={[styles.mainTitle, { color: theme.text }]}>
                    {article?.title || title}
                </Text>
                
                {/* Metadata row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Calendar size={14} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                            {formatPublishedDate(article?.publishedDate)}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={14} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                            {mockData.readingTime} SCANNABLE READ
                        </Text>
                    </View>
                </View>

                {/* Beginner-Friendly Context / Why in News Box */}
                <View style={[styles.summaryBox, { 
                    backgroundColor: isDarkMode ? '#1E293B' : '#EFF6F7', 
                    borderColor: isDarkMode ? '#334155' : '#CCECEE'
                }]}>
                    <View style={styles.summaryHeader}>
                        <Bookmark size={16} color={primaryTeal} />
                        <Text style={[styles.summaryTitleText, { color: primaryTeal }]}>CONTEXT: WHY IN NEWS?</Text>
                    </View>
                    <Text style={[styles.summaryText, { color: theme.text }]}>
                        {article?.summary || "Analyzing key UPSC syllabus intersections..."}
                    </Text>
                </View>

                {/* Consolidated Scannable Exam Focus Card (parsed cleanly) */}
                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 100 }}
                    style={styles.articlesFeed}
                >
                    <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                        <View style={styles.sectionHeaderRow}>
                            <Award size={20} color={primaryTeal} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                UPSC High-Yield Exam Focus (Prelims + Mains)
                            </Text>
                        </View>
                        
                        {/* Dynamic bullets rendering and HTML/JSON stripping */}
                        {renderExamFocusContent(article?.prelimsContent, theme, primaryTeal)}
                    </View>
                </MotiView>

                {/* "Mark as Completed" Bottom Action Trigger */}
                <MotiView 
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 200 }}
                    style={styles.actionSection}
                >
                    <TouchableOpacity
                        onPress={toggleCompleted}
                        activeOpacity={0.85}
                        style={[
                            styles.completedButton,
                            isCompleted 
                                ? { borderColor: '#10B981', borderWidth: 2, backgroundColor: 'transparent' }
                                : { backgroundColor: primaryTeal }
                        ]}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircle2 size={18} color="#10B981" />
                                <Text style={[styles.completedButtonText, { color: '#10B981', fontWeight: '800' }]}>
                                    Completed (Tap to Undo)
                                </Text>
                            </>
                        ) : (
                            <>
                                <BookOpen size={18} color="#FFF" />
                                <Text style={[styles.completedButtonText, { color: '#FFF' }]}>
                                    Mark as Completed
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </MotiView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    loadingText: { fontSize: 14, fontWeight: '600' },
    scrollContent: { 
        paddingHorizontal: isWeb ? '20%' : 20, 
        paddingTop: 40, 
        paddingBottom: 80,
        maxWidth: isWeb ? 1000 : '100%',
        alignSelf: 'center',
        width: '100%'
    },
    headerNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 12 },
    backBtn: { padding: 4 },
    breadcrumbText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    mainTitle: { fontSize: isWeb ? 34 : 24, fontWeight: '900', lineHeight: isWeb ? 44 : 32, marginBottom: 16, letterSpacing: -0.5 },
    metaRow: { flexDirection: 'row', marginBottom: 25, gap: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    // Context Box
    summaryBox: { borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 25, gap: 10 },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryTitleText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    summaryText: { fontSize: 14, lineHeight: 22, fontWeight: '600' },

    // Content Cards
    articlesFeed: { gap: 20, marginBottom: 35 },
    sectionCard: { borderRadius: 24, borderWidth: 1.5, padding: 24, gap: 16 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '900' },
    sectionBodyText: { fontSize: 14, lineHeight: 24, fontWeight: '500' },

    // Smart Bullets & Groups
    contentGroup: { marginBottom: 16, width: '100%' },
    contentHeading: { fontSize: 15, fontWeight: '800', marginBottom: 10, marginTop: 4, letterSpacing: -0.2 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 4, paddingRight: 8 },
    bulletSymbol: { fontSize: 16, marginRight: 8, lineHeight: 20 },
    bulletText: { fontSize: 14, lineHeight: 21, flex: 1, fontWeight: '500' },

    // Action Section
    actionSection: { alignItems: 'center', marginTop: 10 },
    completedButton: { 
        height: 52, 
        borderRadius: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingHorizontal: 30, 
        gap: 10,
        width: isWeb ? 'auto' : '100%',
        minWidth: 260
    },
    completedButtonText: { fontWeight: '800', fontSize: 15 }
});