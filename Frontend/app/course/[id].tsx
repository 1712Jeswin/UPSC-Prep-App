import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Info, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function NotesPreviewScreen() {
    const { id } = useLocalSearchParams();
    const { theme } = useTheme();

    // Breakpoints strategy
    const isDesktop = isWeb && width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
        }).start();
    }, []);

    const BulletPoint = ({ children }: { children: React.ReactNode }) => (
        <View style={styles.bulletRow}>
            <View style={[styles.bullet, { backgroundColor: theme.textSecondary }]} />
            <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{children}</Text>
        </View>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.primary }]}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    const SubHeader = ({ title }: { title: string }) => (
        <View style={[styles.subHeaderWrap, { borderBottomColor: theme.primary + '80' }]}>
            <Text style={[styles.subHeaderText, { color: theme.primary }]}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
            {/* Header / Nav */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Notes Preview</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[
                    styles.contentWrapper,
                    isDesktop ? styles.desktopWrapper : isTablet ? styles.tabletWrapper : null,
                    { opacity: fadeAnim }
                ]}>

                    {/* Document Paper Container */}
                    <View style={[styles.paper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.mainTitle, { color: theme.primary }]}>Educational Development in India</Text>

                        {/* Layout */}
                        <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
                            
                            {/* LEFT COLUMN */}
                            <View style={isDesktop ? styles.colLeft : null}>
                                <SectionHeader title="INTRODUCTION" />
                                <View style={styles.listBlock}>
                                    <BulletPoint>Education is a continuous process of acquiring and sharing knowledge, skills and values</BulletPoint>
                                    <BulletPoint>It is the foundation of a progressive society and shapes responsible citizens</BulletPoint>
                                    <BulletPoint>The word 'Veda' comes from Sanskrit word 'Vid'</BulletPoint>
                                </View>

                                <SectionHeader title="1. EDUCATION IN ANCIENT INDIA" />

                                <SubHeader title="Key Features of Ancient Education" />
                                <View style={styles.listBlock}>
                                    <BulletPoint>Teaching and learning tradition existed in India from very early times</BulletPoint>
                                    <BulletPoint>Focused on holistic development – both innate and latent capacities</BulletPoint>
                                    <BulletPoint>Values taught: humility, truthfulness, discipline, self-reliance, respect for all</BulletPoint>
                                    <BulletPoint>Physical education was part of the curriculum too</BulletPoint>
                                    <BulletPoint>Gurus and students worked together to become proficient in all areas</BulletPoint>
                                </View>

                                <SubHeader title="Sources of Learning" />
                                <View style={styles.listBlock}>
                                    <BulletPoint>Famous scholars: Panini, Aryabhata, Katyayana, Patanjali</BulletPoint>
                                    <BulletPoint>Medical Scholars: Charaka and Sushruta</BulletPoint>
                                    <BulletPoint>Subjects taught: history, logic, architecture, polity, agriculture, trade, animal husbandry, archery</BulletPoint>
                                    <BulletPoint>Literary debates were held to assess students' skills</BulletPoint>
                                    <BulletPoint>Peer learning (senior students taught juniors) was also practiced</BulletPoint>
                                </View>

                                <SubHeader title="The Gurukula System" />
                                {!isDesktop && (
                                   <View style={styles.listBlock}>
                                        <BulletPoint>Both formal and informal education existed in ancient India</BulletPoint>
                                        <BulletPoint>Education was imparted at home, temples, patashalas and gurukulas</BulletPoint>
                                        <BulletPoint>Temples served as important centres of learning</BulletPoint>
                                        <BulletPoint>Gurukula = students lived at their teacher's house as family members</BulletPoint>
                                        <BulletPoint>Teacher = Guru or Acharya</BulletPoint>
                                        <BulletPoint>Gurukulas were often located in forests – peaceful and serene surroundings</BulletPoint>
                                        <BulletPoint>Students lived away from home for years until they achieved their goals</BulletPoint>
                                        <BulletPoint>The guru-student bond strengthened over time</BulletPoint>
                                        <BulletPoint>Main objectives: complete learning, disciplined life, realising inner potential</BulletPoint>
                                   </View> 
                                )}
                            </View>

                            {/* RIGHT COLUMN */}
                            <View style={isDesktop ? styles.colRight : null}>
                                {isDesktop && (
                                    <View style={styles.listBlock}>
                                        <BulletPoint>Both formal and informal education existed in ancient India</BulletPoint>
                                        <BulletPoint>Education was imparted at home, temples, patashalas and gurukulas</BulletPoint>
                                        <BulletPoint>Temples served as important centres of learning</BulletPoint>
                                        <BulletPoint>Gurukula = students lived at their teacher's house as family members</BulletPoint>
                                        <BulletPoint>Teacher = Guru or Acharya</BulletPoint>
                                        <BulletPoint>Gurukulas were often located in forests – peaceful and serene surroundings</BulletPoint>
                                        <BulletPoint>Students lived away from home for years until they achieved their goals</BulletPoint>
                                        <BulletPoint>The guru-student bond strengthened over time</BulletPoint>
                                        <BulletPoint>Main objectives: complete learning, disciplined life, realising inner potential</BulletPoint>
                                    </View>
                                )}

                                <View style={[styles.infoBox, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                                    <View style={styles.infoIconWrap}>
                                        <Info size={16} color={theme.primary} />
                                    </View>
                                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                        <Text style={[styles.infoTextBold, { color: theme.primary }]}>Remember </Text>
                                        The Gurukula system = Teacher's home was the school (like an Ashram). Teaching was ORAL – students remembered and meditated on what was taught.
                                    </Text>
                                </View>

                                <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary + '10' }]}>
                                    <ImageIcon size={32} color={theme.primary + '80'} />
                                    <Text style={[styles.imagePlaceholderText, { color: theme.primary + '80' }]}>Gurukula Illustration</Text>
                                </View>

                                <SubHeader title="Viharas and Universities (Buddhist Period)" />
                                <View style={styles.listBlock}>
                                    <BulletPoint>Monasteries and viharas were set up for monks and nuns to meditate and debate</BulletPoint>
                                    <BulletPoint>These attracted students from China, Korea, Tibet, Burma, Ceylon, Java, Nepal</BulletPoint>
                                    <BulletPoint>Famous ancient universities were at: Taxila, Nalanda, Valabhi, Vikramshila, Odantapuri, Jagaddala</BulletPoint>
                                    <BulletPoint>Benaras and Kanchi universities were connected to temples</BulletPoint>
                                </View>
                            </View>

                        </View>
                    </View>
                    
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'web' ? 16 : 12,
        borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerRight: { width: 40 },
    scrollContent: { paddingBottom: 60 },

    contentWrapper: { padding: 16 },
    tabletWrapper: { paddingHorizontal: 40 },
    desktopWrapper: { alignSelf: 'center', width: '100%', maxWidth: 1100, paddingVertical: 32 },

    paper: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 },
            web: { 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)' as any 
            }
        })
    },

    mainTitle: {
        fontSize: Platform.OS === 'web' ? 36 : 28,
        fontWeight: '800',
        marginBottom: 32,
        textAlign: 'center'
    },

    desktopGrid: {
        flexDirection: 'row',
        gap: 40,
        alignItems: 'flex-start'
    },
    mobileGrid: {
        flexDirection: 'column',
    },
    colLeft: {
        flex: 1
    },
    colRight: {
        flex: 1
    },

    sectionHeader: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 16,
        marginTop: 8
    },
    sectionHeaderText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },

    subHeaderWrap: {
        borderBottomWidth: 1,
        paddingBottom: 4,
        marginBottom: 16,
        marginTop: 16
    },
    subHeaderText: {
        fontSize: 18,
        fontWeight: '800'
    },

    listBlock: {
        marginBottom: 24,
        gap: 8,
        paddingLeft: 4
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22
    },

    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 24,
        gap: 12
    },
    infoIconWrap: {
        marginTop: 2
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22
    },
    infoTextBold: {
        fontWeight: '700'
    },

    imagePlaceholder: {
        height: 200,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8
    },
    imagePlaceholderText: {
        fontWeight: '600',
        fontSize: 14
    }
});
