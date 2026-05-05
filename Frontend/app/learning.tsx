import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, SafeAreaView } from 'react-native';
import { FileText, Download, BarChart2, Scale, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import GlobalHeader from '../components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

export default function LearningScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const primaryTeal = '#4A767D';

    const materials = [
        { id: '1', title: 'Modern History Notes', size: '2.4 MB', icon: <FileText color={primaryTeal} size={isMobile ? 20 : 24} />, bgColor: isDarkMode ? '#1E293B' : '#F0F9FF' },
        { id: '2', title: 'Budget 2026 Analysis', size: '1.1 MB', icon: <BarChart2 color={primaryTeal} size={isMobile ? 20 : 24} />, bgColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
        { id: '3', title: 'Ethics Case Studies', size: '4.5 MB', icon: <Scale color={primaryTeal} size={isMobile ? 20 : 24} />, bgColor: isDarkMode ? '#1E293B' : '#F8FAF2' },
    ];

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
            <GlobalHeader />

            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={s.mobileCenterWrapper}>
                    {/* Header Section */}
                    <View style={[s.pageHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
                                <ChevronLeft size={32} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text style={[s.pageTitle, { color: theme.text, fontSize: isMobile ? 28 : 36 }]}>
                                My Learning
                            </Text>
                            <Text style={[s.pageSubtitle, { color: theme.textSecondary }]}>
                                Access your saved study materials
                            </Text>
                        </View>
                    </View>

                    {/* Content Card */}
                    <View style={[s.contentCard, { backgroundColor: theme.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        {materials.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[s.itemRow, index === materials.length - 1 && { borderBottomWidth: 0 }]}
                                activeOpacity={0.7}
                            >
                                <View style={s.itemLeft}>
                                    <View style={[s.iconBox, { backgroundColor: item.bgColor }]}>
                                        {item.icon}
                                    </View>
                                    <View style={s.textContainer}>
                                        <Text style={[s.itemTitle, { color: theme.text }]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={[s.itemSize, { color: theme.textTertiary }]}>
                                            {item.size}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={s.downloadBtn}>
                                    <Download size={isMobile ? 18 : 22} color={isDarkMode ? theme.textTertiary : "#94A3B8"} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Recently Viewed Section */}
                    <View style={s.footerContainer}>
                        <View style={s.footerHeader}>
                            <Text style={[s.recentLabel, { color: theme.textSecondary }]}>Recently viewed</Text>
                            <TouchableOpacity>
                                <Text style={[s.viewAllText, { color: primaryTeal }]}>View all →</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScroll}>
                            <View style={[s.chip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[s.chipText, { color: theme.textSecondary }]}>Civics MCQ</Text>
                            </View>
                            <View style={[s.chip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[s.chipText, { color: theme.textSecondary }]}>Map Work</Text>
                            </View>
                            <View style={[s.chip, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <Text style={[s.chipText, { color: theme.textSecondary }]}>Art & Culture</Text>
                            </View>
                        </ScrollView>
                    </View>

                    {/* Platform Credits */}
                    <Text style={[s.platformFooter, { color: theme.textTertiary }]}>
                        © 2026 Ethora Learning Platform.{"\n"}All materials are for personal use.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    mobileCenterWrapper: {
        width: isMobile ? '92%' : '100%',
        maxWidth: 800,
        alignSelf: 'center',
        paddingTop: isMobile ? 20 : 50,
    },
    pageHeader: { marginBottom: isMobile ? 20 : 35 },
    pageTitle: { fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 14, marginTop: 4, opacity: 0.8 },

    contentCard: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: isMobile ? 15 : 25,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
            android: { elevation: 2 },
        }),
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: isMobile ? 16 : 22,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: {
        width: isMobile ? 40 : 52,
        height: isMobile ? 40 : 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: isMobile ? 12 : 20,
    },
    textContainer: { flex: 1 },
    itemTitle: { fontSize: isMobile ? 15 : 18, fontWeight: '700' },
    itemSize: { fontSize: 12, marginTop: 2, fontWeight: '600' },
    downloadBtn: { padding: 8, marginLeft: 10 },

    footerContainer: { marginTop: 30 },
    footerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 4
    },
    recentLabel: { fontSize: 14, fontWeight: '700' },
    chipScroll: { gap: 8 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipText: { fontSize: 12, fontWeight: '700' },
    viewAllText: { fontWeight: '800', fontSize: 13 },

    platformFooter: {
        marginTop: 60,
        textAlign: 'center',
        fontSize: 11,
        lineHeight: 18,
        letterSpacing: 0.5,
    }
});