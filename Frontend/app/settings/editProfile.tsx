import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, KeyboardAvoidingView, Platform, Alert, Dimensions
} from 'react-native';
import { ChevronLeft, BookOpen, Clock, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Import your Global Header
import GlobalHeader from '../../components/GlobalHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EditProfileScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    // Core states based on your reference image
    const [name, setName] = useState("Abhinav Kumar");
    const [targetYear, setTargetYear] = useState("2026");
    const [optionalSubject, setOptionalSubject] = useState("Anthropology");
    const [attemptCount, setAttemptCount] = useState("1");
    const [dailyGoal, setDailyGoal] = useState("8");
    const [homeState, setHomeState] = useState("Tamil Nadu");

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const savedData = await AsyncStorage.getItem('user_profile');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setName(parsed.name || "Abhinav Kumar");
                setTargetYear(parsed.targetYear || "2026");
                setOptionalSubject(parsed.optionalSubject || "Anthropology");
                setAttemptCount(parsed.attemptCount || "1");
                setDailyGoal(parsed.dailyGoal || "8");
                setHomeState(parsed.homeState || "Tamil Nadu");
            }
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        try {
            const profileData = { name, targetYear, optionalSubject, attemptCount, dailyGoal, homeState };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Redirects to Profile page after saving
            router.push('/profile');
        } catch (e) {
            Alert.alert("Error", "Failed to save profile.");
        }
    };

    return (
        <View style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F9FBFC' }]}>
            {/* 1. Global Header Added Here */}
            <GlobalHeader />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>



                <View style={s.mainHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                                <ChevronLeft size={32} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text style={[s.title, { color: theme.text }]}>Aspirant Profile</Text>
                            <Text style={[s.subtitle, { color: theme.textSecondary }]}>
                                Manage your exam focus and study preferences
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={handleSave} style={[s.doneBtn, { backgroundColor: '#4A767D' }]}>
                        <Text style={s.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. SYLLABUS & FOCUS SECTION */}
                <View style={[s.sectionCard, { backgroundColor: theme.surface }]}>
                    <View style={s.sectionHeader}>
                        <BookOpen size={18} color={'#4A767D'} />
                        <Text style={[s.sectionTitle, { color: '#4A767D' }]}>SYLLABUS & FOCUS</Text>
                    </View>

                    <View style={s.grid}>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Full Name</Text>
                            <TextInput style={s.inputBox} value={name} onChangeText={setName} placeholder="Your Name" />
                        </View>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Target Year</Text>
                            <TextInput style={s.inputBox} value={targetYear} onChangeText={setTargetYear} keyboardType="numeric" />
                        </View>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Attempt No.</Text>
                            <TextInput style={s.inputBox} value={attemptCount} onChangeText={setAttemptCount} keyboardType="numeric" />
                        </View>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Optional Subject</Text>
                            <TextInput style={s.inputBox} value={optionalSubject} onChangeText={setOptionalSubject} placeholder="e.g. PSIR, Geography" />
                        </View>
                    </View>
                </View>

                {/* 4. STUDY HABITS SECTION */}
                <View style={[s.sectionCard, { backgroundColor: theme.surface }]}>
                    <View style={s.sectionHeader}>
                        <Clock size={18} color={'#4A767D'} />
                        <Text style={[s.sectionTitle, { color: '#4A767D' }]}>STUDY HABITS</Text>
                    </View>

                    <View style={s.grid}>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Daily Study Goal (Hours)</Text>
                            <View style={s.unitInputRow}>
                                <TextInput style={[s.inputBox, { flex: 1 }]} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="numeric" />
                                <Text style={s.unitText}>hrs/day</Text>
                            </View>
                        </View>
                        <View style={s.inputWrapper}>
                            <Text style={s.label}>Home State / Cadre Pref.</Text>
                            <TextInput style={s.inputBox} value={homeState} onChangeText={setHomeState} placeholder="Not Set" />
                        </View>
                    </View>
                </View>

                {/* 5. FOOTER INFO BOX */}
                <View style={[s.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6F7' }]}>
                    <Info size={20} color={'#4A767D'} style={{ marginRight: 12 }} />
                    <Text style={[s.infoText, { color: theme.textSecondary }]}>
                        These details help us recommend better <Text style={{ fontWeight: '700' }}>Peer Groups</Text> and <Text style={{ fontWeight: '700' }}>Mock Tests</Text> tailored to your Optional and State.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Platform.OS === 'web' ? '5%' : 20,
        paddingBottom: 100,
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
        paddingTop: 30
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 35
    },
    title: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, marginTop: 6, opacity: 0.8 },

    doneBtn: {
        paddingHorizontal: 45,
        paddingVertical: 14,
        borderRadius: 10,
        shadowColor: '#4A767D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    sectionCard: {
        borderRadius: 16,
        padding: 28,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
            android: { elevation: 1 }
        })
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    inputWrapper: {
        width: Platform.OS === 'web' && SCREEN_WIDTH > 768 ? '48%' : '100%',
        marginBottom: 22
    },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#475569' },
    inputBox: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 16,
        fontSize: 16,
        color: '#1E293B'
    },
    unitInputRow: { flexDirection: 'row', alignItems: 'center' },
    unitText: { position: 'absolute', right: 18, color: '#94A3B8', fontSize: 14, fontWeight: '500' },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D1E2E4'
    },
    infoText: { flex: 1, fontSize: 15, lineHeight: 22 }
});