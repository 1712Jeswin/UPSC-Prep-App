import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function UpscAffairs() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(false);
    const [article, setArticle] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';

    const fetchDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                setError('Please login to view structured affairs');
                setLoading(false);
                return;
            }

            // First we need to get the details from the today's affairs API which returns the structured content
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/current-affairs/today`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const json = await response.json();
            if (json.success) {
                const found = json.data.affairs.find((a: any) => a.id === id);
                if (found) {
                    setArticle(found);
                } else {
                    setError('Article not found in today\'s list');
                }
            } else {
                setError(json.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        fetchDetails();
    }, [id]);

    const markAsRead = async () => {
        if (!article || markingRead || article.isRead) return;
        
        // Optimistic UI update
        setArticle((prev: any) => ({ ...prev, isRead: true }));
        setMarkingRead(true);
        
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v2/current-affairs/mark-read`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ affairId: article.id })
            });
            const json = await response.json();
            
            if (json.success) {
                // Sync with backend
                await fetchDetails();
            } else {
                // Revert optimistic update
                setArticle((prev: any) => ({ ...prev, isRead: false }));
                alert(json.message);
            }
        } catch (error) {
            // Revert optimistic update
            setArticle((prev: any) => ({ ...prev, isRead: false }));
            alert('Failed to mark as read');
        } finally {
            setMarkingRead(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={primaryTeal} />
            </View>
        );
    }

    if (error || !article) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <Text style={{ color: 'red' }}>{error || 'Article not found'}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: primaryTeal }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const content = article.structuredContent || {};

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Structured Analysis</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.titleSection}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: primaryTeal + '20' }]}>
                            <Text style={[styles.badgeText, { color: primaryTeal }]}>{article.category}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: article.difficulty === 'Hard' ? '#FEE2E2' : article.difficulty === 'Medium' ? '#FEF3C7' : '#D1FAE5' }]}>
                            <Text style={[styles.badgeText, { color: article.difficulty === 'Hard' ? '#DC2626' : article.difficulty === 'Medium' ? '#D97706' : '#059669' }]}>
                                {article.difficulty}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>{content.title}</Text>
                </View>

                {content.context && (
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: primaryTeal }]}>Context</Text>
                        <Text style={[styles.text, { color: theme.text }]}>{content.context}</Text>
                    </View>
                )}

                {content.whyInNews && (
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: primaryTeal }]}>Why in News</Text>
                        <Text style={[styles.text, { color: theme.text }]}>{content.whyInNews}</Text>
                    </View>
                )}

                {content.keyPoints && content.keyPoints.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: primaryTeal }]}>Key Points</Text>
                        {content.keyPoints.map((pt: string, i: number) => (
                            <View key={i} style={styles.bulletRow}>
                                <Text style={[styles.bullet, { color: theme.text }]}>•</Text>
                                <Text style={[styles.text, { color: theme.text, flex: 1 }]}>{pt}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {content.prelimsFacts && content.prelimsFacts.length > 0 && (
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: '#3B82F6' }]}>Prelims Facts</Text>
                        {content.prelimsFacts.map((pt: string, i: number) => (
                            <View key={i} style={styles.bulletRow}>
                                <Text style={[styles.bullet, { color: theme.text }]}>•</Text>
                                <Text style={[styles.text, { color: theme.text, flex: 1 }]}>{pt}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {content.mainsInsight && (
                    <View style={[styles.section, { backgroundColor: theme.surface, borderLeftWidth: 4, borderLeftColor: primaryTeal }]}>
                        <Text style={[styles.sectionTitle, { color: primaryTeal }]}>Mains Insight</Text>
                        <Text style={[styles.text, { color: theme.text }]}>{content.mainsInsight}</Text>
                    </View>
                )}

                <TouchableOpacity 
                    onPress={markAsRead} 
                    disabled={article.isRead || markingRead}
                    style={[
                        styles.readButton, 
                        { backgroundColor: article.isRead ? '#10B981' : primaryTeal }
                    ]}
                >
                    {markingRead ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            {article.isRead && <CheckCircle color="#fff" size={20} style={{ marginRight: 8 }} />}
                            <Text style={styles.readButtonText}>
                                {article.isRead ? 'Completed' : 'Mark as Read'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 100, maxWidth: isWeb ? 800 : '100%', alignSelf: 'center', width: '100%' },
    titleSection: { marginBottom: 24 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    title: { fontSize: 24, fontWeight: '800', lineHeight: 32 },
    section: { padding: 20, borderRadius: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    text: { fontSize: 16, lineHeight: 24 },
    bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
    bullet: { fontSize: 18, marginRight: 8, lineHeight: 24 },
    readButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 20 },
    readButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
