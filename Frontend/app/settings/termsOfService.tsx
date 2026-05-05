import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Scale, ShieldIcon, FileText } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TermsOfService() {
    const router = useRouter();
    const { theme } = useTheme();

    // Section Component for clean layout
    const Section = ({ title, content }: { title: string, content: string }) => (
        <View style={s.section}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[s.sectionContent, { color: theme.textSecondary }]}>{content}</Text>
        </View>
    );

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <SafeAreaView
                edges={['top']}
                style={{ backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}
            >
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <ChevronLeft size={28} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={[s.headerTitle, { color: theme.text }]}>Terms of Service</Text>
                    <View style={{ width: 28 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {/* Brand Visual */}
                <View style={s.iconHeader}>
                    <View style={[s.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
                        <Scale size={36} color={theme.primary} />
                    </View>
                    <Text style={[s.brandName, { color: theme.primary }]}>Ethora Legal</Text>
                    <Text style={[s.lastUpdated, { color: theme.textTertiary }]}>Effective: February 2026</Text>
                </View>

                {/* Content Sections */}
                <Section
                    title="1. Agreement to Terms"
                    content="By accessing or using Ethora, you agree to be bound by these Terms of Service. Ethora is a dedicated platform designed for UPSC aspirants to track, manage, and optimize their preparation journey."
                />

                <Section
                    title="2. Account Responsibility"
                    content="You are responsible for maintaining the confidentiality of your account credentials. Any study data generated under your profile is your responsibility. Ethora reserves the right to terminate accounts that violate UPSC preparation ethics or engage in content piracy."
                />

                <Section
                    title="3. Data & Privacy"
                    content="Your study data is processed to provide personalized analytics. While Ethora offers an 'Incognito Study Mode' to pause tracking, essential system data is still collected as outlined in our Privacy Policy to ensure app stability."
                />

                <Section
                    title="4. Intellectual Property"
                    content="All software, UI designs, and proprietary study tools provided by Ethora are the exclusive property of Ethora. You may not reverse-engineer, redistribute, or use our assets for commercial purposes without written consent."
                />

                <Section
                    title="5. User Backups"
                    content="The 'Backup Study Data' feature allows you to export your progress. Ethora is not liable for data loss occurring due to user deletion or failure to perform regular exports of local study records."
                />

                <View style={s.footer}>
                    <ShieldIcon size={16} color={theme.textTertiary} />
                    <Text style={[s.footerText, { color: theme.textTertiary }]}>
                        Ethora is committed to your privacy and prep success.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 65, maxWidth: 600, width: '100%', alignSelf: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    backBtn: { padding: 5, marginLeft: -5 },
    content: { padding: 25, maxWidth: 600, width: '100%', alignSelf: 'center' },
    iconHeader: { alignItems: 'center', marginBottom: 40 },
    iconCircle: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    brandName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    lastUpdated: { fontSize: 12, fontWeight: '600', opacity: 0.6 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: 0.3 },
    sectionContent: { fontSize: 14, lineHeight: 22, textAlign: 'justify' },
    footer: { marginTop: 20, marginBottom: 50, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    footerText: { fontSize: 12, fontWeight: '500' }
});