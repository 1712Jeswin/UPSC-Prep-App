import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Sparkles, ArrowLeft, Bookmark, Clock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlobalHeader from '../components/GlobalHeader'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');

export default function EditorialAnalyst() {
    const { theme, isDarkMode } = useTheme();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    
    const [article, setArticle] = useState<any>(null);
    const [mcqs, setMcqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingRead, setMarkingRead] = useState(false);
    const [isRead, setIsRead] = useState(false);
    const [structuredAffairId, setStructuredAffairId] = useState<string | null>(null);
    
    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';

    useEffect(() => {
        if (!id) return;
        const fetchDetails = async () => {
            try {
                const [articleRes, mcqsRes] = await Promise.all([
                    fetch(`${process.env.EXPO_PUBLIC_API_URL}/current-affairs/article/${id}`),
                    fetch(`${process.env.EXPO_PUBLIC_API_URL}/current-affairs/article/${id}/mcqs`)
                ]);
                const articleJson = await articleRes.json();
                const mcqsJson = await mcqsRes.json();
                
                if (articleJson.success) {
                    setArticle(articleJson.data);
                } else {
                    setError(articleJson.message);
                }
                
                if (mcqsJson.success) {
                    setMcqs(mcqsJson.data || []); // API might return data directly or items
                }
                
                const token = await AsyncStorage.getItem('accessToken');
                if (token) {
                    const progRes = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/current-affairs/today`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const progJson = await progRes.json();
                    if (progJson.success) {
                        const found = progJson.data.affairs.find((a: any) => a.rawArticleId === id);
                        if (found) {
                            setStructuredAffairId(found.id);
                            setIsRead(found.isRead);
                        }
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const parseJSON = (val: any) => {
        if (!val) return [];
        if (typeof val !== 'string') return val;
        try {
            return JSON.parse(val);
        } catch {
            return [val];
        }
    };

    const markAsRead = async () => {
        if (!structuredAffairId || markingRead || isRead) return;
        
        setIsRead(true);
        setMarkingRead(true);
        
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/current-affairs/mark-read`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ affairId: structuredAffairId })
            });
            const json = await response.json();
            
            if (!json.success) {
                setIsRead(false);
                alert(json.message);
            }
        } catch (error) {
            setIsRead(false);
            alert('Failed to mark as read');
        } finally {
            setMarkingRead(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <GlobalHeader />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerNavRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={primaryTeal} />
                    </TouchableOpacity>
                    <View style={styles.breadcrumbContainer}>
                        <Text style={[styles.breadcrumbText, { color: primaryTeal }]}>
                            {article?.category?.split('•')[0]?.trim() || "CURRENT AFFAIRS"}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={markAsRead}
                            disabled={isRead || markingRead || !structuredAffairId}
                        >
                            {markingRead ? (
                                <ActivityIndicator size="small" color={primaryTeal} />
                            ) : (
                                <Bookmark 
                                    size={20} 
                                    color={isRead ? primaryTeal : theme.textSecondary} 
                                    fill={isRead ? primaryTeal : 'transparent'}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={primaryTeal} style={{ marginTop: 100 }} />
                ) : error ? (
                    <View style={styles.centerBox}>
                        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</Text>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, { backgroundColor: primaryTeal }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : !article ? (
                    <Text style={{ color: theme.text, textAlign: 'center', marginTop: 100 }}>Article not found.</Text>
                ) : (
                    <MotiView 
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                    >
                        {/* Title Section */}
                        <Text style={[styles.mainTitle, { color: theme.text }]}>{article.title}</Text>
                        
                        <View style={styles.metaRow}>
                            <View style={styles.chipRow}>
                                {(article.category || 'General').split('•').map((cat: string, i: number) => (
                                    <View key={i} style={[styles.categoryChip, { backgroundColor: primaryTeal + '15' }]}>
                                        <Text style={[styles.categoryChipText, { color: primaryTeal }]}>{cat.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.metaInfo}>
                                <Clock size={12} color={theme.textSecondary} />
                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                    {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'} • 2 min read
                                </Text>
                            </View>
                        </View>

                        {/* 1. Why in News */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.indicator, { backgroundColor: primaryTeal }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Why in News?</Text>
                            </View>
                            <Text style={[styles.sectionContent, { color: theme.text }]}>{article.whyInNews}</Text>
                        </View>

                        {/* 2. Background */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.indicator, { backgroundColor: '#F59E0B' }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Background</Text>
                            </View>
                            {(article.background || '').split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                                <View key={i} style={styles.bulletRow}>
                                    <Text style={[styles.bullet, { color: primaryTeal }]}>•</Text>
                                    <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{line.trim().replace(/^•\s*/, '')}</Text>
                                </View>
                            ))}
                        </View>

                        {/* 3. Key Points */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.indicator, { backgroundColor: '#10B981' }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Highlights</Text>
                            </View>
                            {parseJSON(article.keyPoints).map((pt: string, i: number) => (
                                <View key={i} style={styles.pointRow}>
                                    <View style={[styles.pointBadge, { backgroundColor: primaryTeal + '15' }]}>
                                        <Text style={[styles.pointBadgeText, { color: primaryTeal }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={[styles.bulletText, { color: theme.text }]}>{pt}</Text>
                                </View>
                            ))}
                        </View>

                        {/* 4. Prelims Facts */}
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.indicator, { backgroundColor: '#3B82F6' }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Prelims Facts</Text>
                            </View>
                            <View style={styles.factGrid}>
                                {parseJSON(article.prelimsFacts).map((fact: string, i: number) => (
                                    <View key={i} style={[styles.factChip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                        <Text style={[styles.factChipText, { color: theme.text }]}>{fact}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* 5. Mains Angle */}
                        <View style={[styles.sectionCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderLeftWidth: 4, borderLeftColor: primaryTeal }]}>
                            <Text style={[styles.mainsLabel, { color: primaryTeal }]}>Mains Perspective</Text>
                            <Text style={[styles.mainsText, { color: theme.text }]}>
                                <Text style={{ fontWeight: '800' }}>Q: </Text>{article.mainsAngle}
                            </Text>
                        </View>

                        {/* 6. Quiz Section */}
                        {mcqs.length > 0 && (
                            <QuizSection mcqs={mcqs} primaryColor={primaryTeal} theme={theme} isDarkMode={isDarkMode} />
                        )}

                    </MotiView>
                )}
            </ScrollView>
        </View>
    );
}

function QuizSection({ mcqs, primaryColor, theme, isDarkMode }: any) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const currentMCQ = mcqs[currentIndex];
    if (!currentMCQ) return null;

    const options = typeof currentMCQ.options === 'string' ? JSON.parse(currentMCQ.options) : (currentMCQ.options || []);

    const handleSelect = (opt: string) => {
        if (showResult) return;
        setSelectedOption(opt);
        setShowResult(true);
    };

    const next = () => {
        if (currentIndex < mcqs.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setShowResult(false);
        }
    };

    return (
        <View style={[styles.quizBox, { backgroundColor: isDarkMode ? '#1E293B' : '#111827' }]}>
            <View style={styles.quizTop}>
                <Sparkles size={18} color="#F59E0B" />
                <Text style={styles.quizTitle}>Daily Recall</Text>
                <Text style={styles.quizCount}>{currentIndex + 1} / {mcqs.length}</Text>
            </View>

            <Text style={styles.questionText}>{currentMCQ.question}</Text>

            <View style={styles.optionsContainer}>
                {options.map((opt: string, i: number) => {
                    const isCorrect = opt === currentMCQ.answer;
                    const isSelected = opt === selectedOption;
                    let bColor = isDarkMode ? '#334155' : '#374151';
                    
                    if (showResult) {
                        if (isCorrect) bColor = '#065F46';
                        else if (isSelected) bColor = '#7F1D1D';
                    }

                    return (
                        <TouchableOpacity 
                            key={i} 
                            onPress={() => handleSelect(opt)}
                            style={[styles.optionItem, { backgroundColor: bColor }]}
                        >
                            <Text style={styles.optionItemText}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {showResult && (
                <View style={styles.quizResultArea}>
                    <Text style={[styles.resultMsg, { color: selectedOption === currentMCQ.answer ? '#34D399' : '#F87171' }]}>
                        {selectedOption === currentMCQ.answer ? 'Correct Answer!' : 'Needs Review'}
                    </Text>
                    {currentIndex < mcqs.length - 1 && (
                        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: primaryColor }]} onPress={next}>
                            <Text style={styles.nextBtnText}>Next Question</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        paddingHorizontal: isWeb ? (width > 1200 ? '25%' : '15%') : 16, 
        paddingTop: isWeb ? 40 : 20, 
        paddingBottom: 80,
        maxWidth: isWeb ? 1400 : '100%',
        alignSelf: 'center',
        width: '100%'
    },
    headerNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: isWeb ? 30 : 20, gap: 12 },
    backBtn: { width: isWeb ? 40 : 36, height: isWeb ? 40 : 36, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    breadcrumbContainer: { flex: 1 },
    breadcrumbText: { fontSize: isWeb ? 13 : 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    headerActions: { flexDirection: 'row', gap: isWeb ? 16 : 8 },
    actionBtn: { padding: 6 },
    centerBox: { marginTop: 100, alignItems: 'center', paddingHorizontal: 20 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    
    mainTitle: { 
        fontSize: isWeb ? (width > 1000 ? 38 : 32) : 24, 
        fontWeight: '900', 
        lineHeight: isWeb ? (width > 1000 ? 48 : 40) : 32, 
        marginBottom: isWeb ? 24 : 16,
        letterSpacing: -0.5
    },
    metaRow: { 
        marginBottom: isWeb ? 40 : 30, 
        flexDirection: isWeb ? 'row' : 'column', 
        alignItems: isWeb ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        gap: 16 
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    categoryChipText: { fontSize: isWeb ? 11 : 10, fontWeight: '800', textTransform: 'uppercase' },
    metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: isWeb ? 14 : 12, fontWeight: '600' },

    sectionCard: { 
        padding: isWeb ? 28 : 20, 
        borderRadius: 24, 
        marginBottom: 20,
        ...Platform.select({
            web: { boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }
        })
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    indicator: { width: 4, height: 20, borderRadius: 2 },
    sectionTitle: { fontSize: isWeb ? 18 : 16, fontWeight: '800' },
    sectionContent: { fontSize: isWeb ? 16 : 15, lineHeight: isWeb ? 26 : 24, opacity: 0.9 },
    
    bulletRow: { flexDirection: 'row', marginBottom: 10, gap: 12 },
    bullet: { fontSize: 20, marginTop: -4 },
    bulletText: { flex: 1, fontSize: isWeb ? 15 : 14, lineHeight: isWeb ? 24 : 22 },
    
    pointRow: { flexDirection: 'row', marginBottom: 14, gap: 14, alignItems: 'flex-start' },
    pointBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    pointBadgeText: { fontSize: 13, fontWeight: '900' },
    
    factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    factChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
    factChipText: { fontSize: isWeb ? 14 : 13, fontWeight: '600' },
    
    mainsLabel: { fontSize: isWeb ? 14 : 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
    mainsText: { fontSize: isWeb ? 17 : 15, lineHeight: isWeb ? 28 : 24, fontStyle: 'italic' },

    quizBox: { borderRadius: 32, padding: isWeb ? 40 : 24, marginTop: 30 },
    quizTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    quizTitle: { color: '#FFF', fontSize: isWeb ? 22 : 18, fontWeight: '900', flex: 1 },
    quizCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
    questionText: { color: '#FFF', fontSize: isWeb ? 18 : 16, fontWeight: '700', lineHeight: isWeb ? 28 : 24, marginBottom: 30 },
    optionsContainer: { 
        flexDirection: isWeb && width > 800 ? 'row' : 'column', 
        flexWrap: 'wrap', 
        gap: 12 
    },
    optionItem: { 
        padding: isWeb ? 20 : 16, 
        borderRadius: 18,
        width: isWeb && width > 800 ? '48.5%' : '100%'
    },
    optionItemText: { color: '#FFF', fontSize: isWeb ? 15 : 14, fontWeight: '600' },
    quizResultArea: { marginTop: 30, alignItems: 'center', gap: 20 },
    resultMsg: { fontSize: 16, fontWeight: '800' },
    nextBtn: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16 },
    nextBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});