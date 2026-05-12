import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function UpscQuiz() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [quizData, setQuizData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = await AsyncStorage.getItem('accessToken');
                if (!token) {
                    setError('Please login to view the quiz');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/quiz/start`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const json = await response.json();
                if (json.success) {
                    setQuizData(json.data);
                } else {
                    setError(json.message);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load quiz');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, []);

    const handleSelect = (quizId: string, option: string) => {
        if (result) return;
        setAnswers(prev => ({ ...prev, [quizId]: option }));
    };

    const submitQuiz = async () => {
        if (!quizData || !quizData.questions) return;
        
        // Validation: Ensure all questions answered
        if (Object.keys(answers).length !== quizData.questions.length && quizData.questions.length > 0) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const formatAnswers = Object.entries(answers).map(([quizId, selectedAnswer]) => ({
                quizId,
                selectedAnswer
            }));

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/quiz/submit`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: formatAnswers })
            });
            const json = await response.json();
            
            if (json.success) {
                setResult(json.data);
            } else {
                alert(json.message);
            }
        } catch (error) {
            alert('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={primaryTeal} />
            </View>
        );
    }

    if (error || !quizData) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: 'red' }}>{error || 'Data not found'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: primaryTeal }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!quizData.quizUnlocked) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background, padding: 20 }]}>
                <Lock size={64} color={theme.textSecondary} style={{ marginBottom: 20 }} />
                <Text style={[styles.lockedTitle, { color: theme.text }]}>Quiz Locked</Text>
                <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
                    Complete all of today's articles to unlock the daily quiz.
                </Text>
                <TouchableOpacity onPress={() => router.push('/upsc-progress')} style={[styles.submitButton, { backgroundColor: primaryTeal, width: '100%', maxWidth: 300 }]}>
                    <Text style={styles.submitButtonText}>View Progress</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (quizData.questions.length === 0) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background, padding: 20 }]}>
                <Text style={[styles.lockedTitle, { color: theme.text }]}>No Quiz Today</Text>
                <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
                    There are no questions generated for today's articles.
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: primaryTeal }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Quiz</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {result && (
                    <View style={[styles.resultCard, { backgroundColor: result.percentage >= 70 ? '#10B981' : (result.percentage >= 40 ? '#F59E0B' : '#EF4444') }]}>
                        <Text style={styles.resultTitle}>Score</Text>
                        <Text style={styles.resultScore}>{result.score} / {result.total}</Text>
                        <Text style={styles.resultDesc}>
                            {result.percentage >= 70 ? 'Excellent work!' : (result.percentage >= 40 ? 'Good effort, keep learning!' : 'Needs more revision.')}
                        </Text>
                    </View>
                )}

                {quizData.questions.map((q: any, i: number) => {
                    const ansResult = result?.results.find((r: any) => r.quizId === q.id);
                    const selected = answers[q.id];
                    
                    return (
                        <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.questionNum, { color: primaryTeal }]}>Question {i + 1}</Text>
                            <Text style={[styles.questionText, { color: theme.text }]}>{q.question}</Text>
                            
                            <View style={styles.optionsList}>
                                {(q.options || []).map((opt: string, optIdx: number) => {
                                    let bgColor = theme.background;
                                    let borderColor = theme.border;
                                    
                                    if (result) {
                                        if (opt === ansResult?.correctAnswer) {
                                            bgColor = '#D1FAE5';
                                            borderColor = '#10B981';
                                        } else if (opt === selected && !ansResult?.isCorrect) {
                                            bgColor = '#FEE2E2';
                                            borderColor = '#EF4444';
                                        }
                                    } else {
                                        if (opt === selected) {
                                            bgColor = primaryTeal + '20';
                                            borderColor = primaryTeal;
                                        }
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={optIdx}
                                            disabled={!!result}
                                            onPress={() => handleSelect(q.id, opt)}
                                            style={[
                                                styles.optionButton,
                                                { backgroundColor: bgColor, borderColor: borderColor, borderWidth: opt === selected || result ? 2 : 1 }
                                            ]}
                                        >
                                            <Text style={[styles.optionText, { color: theme.text, fontWeight: opt === selected ? '700' : '400' }]}>{opt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {result && (
                                <View style={[styles.explanationBox, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.explanationTitle, { color: primaryTeal }]}>Explanation</Text>
                                    <Text style={[styles.explanationText, { color: theme.textSecondary }]}>{ansResult?.explanation || 'No explanation provided.'}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}

                {!result && (
                    <TouchableOpacity 
                        onPress={submitQuiz}
                        disabled={submitting}
                        style={[styles.submitButton, { backgroundColor: primaryTeal }]}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Answers</Text>
                        )}
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 100, maxWidth: isWeb ? 800 : '100%', alignSelf: 'center', width: '100%' },
    
    lockedTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
    lockedText: { fontSize: 16, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
    
    resultCard: { padding: 24, borderRadius: 20, marginBottom: 24, alignItems: 'center' },
    resultTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    resultScore: { color: '#FFF', fontSize: 48, fontWeight: '900', marginVertical: 8 },
    resultDesc: { color: '#FFF', fontSize: 16, fontWeight: '500' },

    questionCard: { padding: 20, borderRadius: 20, marginBottom: 20 },
    questionNum: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    questionText: { fontSize: 18, fontWeight: '600', lineHeight: 28, marginBottom: 20 },
    
    optionsList: { gap: 12 },
    optionButton: { padding: 16, borderRadius: 12 },
    optionText: { fontSize: 16 },
    
    explanationBox: { padding: 16, borderRadius: 12, marginTop: 20 },
    explanationTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    explanationText: { fontSize: 15, lineHeight: 24 },

    submitButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
