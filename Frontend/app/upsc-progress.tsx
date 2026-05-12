import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, CheckCircle, Lock, Unlock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function UpscProgress() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const token = await AsyncStorage.getItem('accessToken');
                if (!token) {
                    setError('Please login to view progress');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/current-affairs/today`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const json = await response.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.message);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load progress');
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={primaryTeal} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: 'red' }}>{error || 'Data not found'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: primaryTeal }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { progress, affairs } = data;
    const progressPercent = progress?.percentage || 0;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Daily Progress</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={[styles.statsCard, { backgroundColor: primaryTeal }]}>
                    <Text style={styles.statsTitle}>Today's Target</Text>
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={styles.statsValue}>{progress?.completed || 0} / {progress?.total || 0}</Text>
                            <Text style={styles.statsLabel}>Articles Read</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {progress?.quizUnlocked ? (
                                <Unlock size={32} color="#10B981" />
                            ) : (
                                <Lock size={32} color="rgba(255,255,255,0.5)" />
                            )}
                            <Text style={styles.statsLabel}>{progress?.quizUnlocked ? 'Quiz Unlocked!' : 'Quiz Locked'}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.progressBarBg}>
                        <MotiView 
                            from={{ width: '0%' }}
                            animate={{ width: `${progressPercent}%` }}
                            style={styles.progressBarFill}
                        />
                    </View>
                </View>

                {progress?.quizUnlocked && (
                    <TouchableOpacity 
                        style={[styles.quizButton, { backgroundColor: '#10B981' }]}
                        onPress={() => router.push('/upsc-quiz')}
                    >
                        <Text style={styles.quizButtonText}>Take Today's Quiz</Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Articles</Text>
                
                {affairs.map((item: any, index: number) => (
                    <TouchableOpacity 
                        key={item.id}
                        style={[styles.articleItem, { backgroundColor: theme.surface }]}
                        onPress={() => router.push({ pathname: '/upsc-affairs', params: { id: item.id } })}
                    >
                        <View style={[styles.statusIcon, { backgroundColor: item.isRead ? '#10B98120' : theme.background }]}>
                            {item.isRead ? (
                                <CheckCircle size={20} color="#10B981" />
                            ) : (
                                <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.articleCategory, { color: primaryTeal }]}>{item.category}</Text>
                            <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={2}>{item.structuredContent?.title || item.title}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 100, maxWidth: isWeb ? 800 : '100%', alignSelf: 'center', width: '100%' },
    
    statsCard: { padding: 24, borderRadius: 24, marginBottom: 24 },
    statsTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    statsValue: { color: '#FFF', fontSize: 36, fontWeight: '800' },
    statsLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
    
    quizButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
    quizButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    
    articleItem: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
    statusIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    articleCategory: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    articleTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 }
});
