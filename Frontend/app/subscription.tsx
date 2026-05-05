import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Alert,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, ArrowRight, Zap, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import GlobalHeader from '@/components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

const PLANS = [
    { id: 'monthly', title: 'MONTHLY', price: 299, period: '/ mo', note: 'Basic access to AI tools.', savings: null },
    { id: 'quarterly', title: 'QUARTERLY', price: 699, period: '/ qu', note: 'Serious analysis for students.', savings: 'SAVE 22%', popular: true },
    { id: 'annual', title: 'YEARLY', price: 1999, period: '/ yr', note: 'Long-term strategic growth.', savings: 'SAVE 44%' },
];

export default function SubscriptionScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    const [selectedId, setSelectedId] = useState('quarterly');
    const primaryTeal = '#4A767D';

    const handleUpgrade = (plan: any) => {
        Alert.alert(
            "Confirm Upgrade",
            `Subscribe to ${plan.title} for ₹${plan.price}?`,
            [{ text: "Cancel", style: "cancel" }, { text: "Proceed", onPress: () => console.log("Init Payment") }]
        );
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F9FBFC' }]}>
            <GlobalHeader />

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                <View style={s.mobileWrapper}>

                    {/* Header Section */}
                    <Animated.View entering={FadeInDown.duration(600)} style={s.headerSection}>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 0, top: 0, padding: 8 }}>
                                <ChevronLeft size={24} color={theme.text} />
                            </TouchableOpacity>
                        )}
                        <Zap size={32} color={primaryTeal} style={{ marginBottom: 15 }} />
                        <Text style={[s.mainTitle, { color: theme.text, fontSize: isMobile ? 32 : 44 }]}>
                            Unlock Ethora Pro
                        </Text>
                        <Text style={[s.mainSubtitle, { color: theme.textSecondary }]}>
                            Choose the plan that fits your goals
                        </Text>
                    </Animated.View>

                    {/* Perks Box */}
                    <Animated.View entering={FadeInDown.delay(200)} style={[s.perksBox, { backgroundColor: theme.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <FeatureItem title="Unlimited AI Evaluation" theme={theme} />
                        <FeatureItem title="GS Mapping & Analysis" theme={theme} />
                        <FeatureItem title="Daily Editorial Insights" theme={theme} />
                        <FeatureItem title="Priority Processing" theme={theme} />
                    </Animated.View>

                    {/* Pricing Cards Stack */}
                    <View style={s.pricingStack}>
                        {PLANS.map((plan, index) => {
                            const isSelected = selectedId === plan.id;
                            return (
                                <Animated.View
                                    key={plan.id}
                                    entering={FadeInDown.delay(300 + (index * 100))}
                                    style={[
                                        s.planCard,
                                        { backgroundColor: theme.surface, borderColor: isSelected ? primaryTeal : (isDarkMode ? '#334155' : '#E2E8F0') },
                                        isSelected && { borderWidth: 2, transform: [{ scale: 1.02 }] }
                                    ]}
                                >
                                    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedId(plan.id)}>
                                        <View style={s.cardHeader}>
                                            <Text style={[s.planType, { color: isSelected ? primaryTeal : theme.textTertiary }]}>{plan.title}</Text>
                                            {plan.savings && (
                                                <View style={s.savingsTag}>
                                                    <Text style={s.savingsTagText}>{plan.savings}</Text>
                                                </View>
                                            )}
                                        </View>

                                        <View style={s.priceRow}>
                                            <Text style={[s.currency, { color: theme.text }]}>₹</Text>
                                            <Text style={[s.priceAmount, { color: theme.text }]}>{plan.price}</Text>
                                            <Text style={[s.pricePeriod, { color: theme.textSecondary }]}>{plan.period}</Text>
                                        </View>

                                        <Text style={[s.planNote, { color: theme.textSecondary }]}>{plan.note}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Sticky-style Bottom Button */}
                    <View style={s.actionContainer}>
                        <TouchableOpacity
                            style={[s.bigActionBtn, { backgroundColor: primaryTeal }]}
                            onPress={() => handleUpgrade(PLANS.find(p => p.id === selectedId))}
                        >
                            <Text style={s.bigActionText}>Subscribe Now</Text>
                            <ArrowRight size={20} color="#FFF" style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                        <Text style={s.renewNote}>Cancel anytime. Auto-renews monthly.</Text>
                    </View>

                    {/* Footer Links */}
                    <View style={s.footer}>
                        <Text style={s.footerLink}>Terms</Text>
                        <Text style={s.footerLink}>Privacy</Text>
                        <Text style={s.footerLink}>Restore</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const FeatureItem = ({ title, theme }: { title: string, theme: any }) => (
    <View style={s.perkItem}>
        <Check size={16} color="#4A767D" style={{ marginRight: 12 }} />
        <Text style={[s.perkTitle, { color: theme.textSecondary }]}>{title}</Text>
    </View>
);

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
    mobileWrapper: {
        width: isMobile ? '92%' : '100%',
        maxWidth: 800,
        alignSelf: 'center',
        paddingTop: isMobile ? 20 : 50
    },
    headerSection: { alignItems: 'center', marginBottom: 30 },
    mainTitle: { fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
    mainSubtitle: { fontSize: 15, marginTop: 8, opacity: 0.8, textAlign: 'center' },

    perksBox: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        marginBottom: 30,
        flexDirection: 'column',
        gap: 12
    },
    perkItem: { flexDirection: 'row', alignItems: 'center' },
    perkTitle: { fontSize: 14, fontWeight: '600' },

    pricingStack: { gap: 16, marginBottom: 40 },
    planCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    planType: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    savingsTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    savingsTagText: { color: '#059669', fontSize: 10, fontWeight: '900' },

    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
    currency: { fontSize: 20, fontWeight: '700', marginRight: 2 },
    priceAmount: { fontSize: 36, fontWeight: '900' },
    pricePeriod: { fontSize: 14, marginLeft: 4, opacity: 0.6 },
    planNote: { fontSize: 13, lineHeight: 18 },

    actionContainer: { marginTop: 10 },
    bigActionBtn: {
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        ...Platform.select({
            ios: { shadowColor: '#4A767D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
            android: { elevation: 6 }
        })
    },
    bigActionText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    renewNote: { textAlign: 'center', marginTop: 15, fontSize: 12, color: '#94A3B8' },

    footer: { flexDirection: 'row', justifyContent: 'center', gap: 25, marginTop: 40, opacity: 0.5 },
    footerLink: { fontSize: 12, fontWeight: '600' }
});