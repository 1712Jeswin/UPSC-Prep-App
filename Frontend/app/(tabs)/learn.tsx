import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight, ChevronLeft, FlaskConical, Map, Languages, TestTube, Leaf, Dna, Atom, Brain, Trees, Users, Mountain, Pickaxe, Globe2, BookOpen, Plus, FileText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;
const isTablet = width >= 768 && width < 1024;
const isMobile = width < 768;

const LEARNING_DATA = {
  'unit1': {
    id: 'unit1',
    title: 'Unit-1',
    category: 'GENERAL SCIENCE',
    description: 'Explore the foundations of Chemistry, Biology, and Physics.',
    icon: FlaskConical,
    subjects: [
      { id: 'c1', title: 'Chemistry', icon: TestTube, progress: 0.4 },
      { id: 'c2', title: 'Environment and Ecology', icon: Leaf, progress: 0.2 },
      { id: 'c3', title: 'Life Science', icon: Dna, progress: 0.6 },
      { id: 'c4', title: 'Physical Science', icon: Atom, progress: 0.1 },
      { id: 'c5', title: 'Scientific Thinking', icon: Brain, progress: 0.8 },
    ]
  },
  'unit2': {
    id: 'unit2',
    title: 'Unit-2',
    category: 'GEOGRAPHY OF INDIA',
    description: 'Comprehensive study of Indian geography, resources, and social landscape.',
    icon: Map,
    subjects: [
      { id: 'g1', title: 'Environment Geography', icon: Trees, progress: 0.3 },
      { id: 'g2', title: 'Human and Economic Geography', icon: Users, progress: 0.5 },
      { id: 'g3', title: 'Physical Geography', icon: Mountain, progress: 0.7 },
      { id: 'g4', title: 'Resource Geography', icon: Pickaxe, progress: 0.2 },
      { id: 'g5', title: 'Social Geography', icon: Globe2, progress: 0.4 },
    ]
  }
};

const UNITS = [LEARNING_DATA['unit1'], LEARNING_DATA['unit2']];

const MEDIUMS = [
  { id: 'english', title: 'English', icon: Languages, description: 'Study in English medium' },
  { id: 'tamil', title: 'Tamil', icon: Languages, description: 'Study in Tamil medium' }
];

export default function LearnScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter();
    
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const primaryTeal = theme.primary;
    const cardBg = theme.surface;
    const borderCol = theme.border;

    const handlePress = (id: string, type: 'unit' | 'medium' | 'subject') => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        if (type === 'unit') {
            setSelectedUnit(id);
        } else if (type === 'medium') {
            setSelectedMedium(id);
        } else {
            router.push(`/course/${id}`);
        }
    };

    const handleBack = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (selectedMedium) {
            setSelectedMedium(null);
        } else if (selectedUnit) {
            setSelectedUnit(null);
        } else {
            if (Platform.OS === 'web') router.back();
        }
    };

    const renderHeader = () => {
        let mainTitle = 'Learn';
        let subTitle = 'Master the UPSC syllabus with curated modules';

        if (selectedUnit) {
            mainTitle = LEARNING_DATA[selectedUnit as keyof typeof LEARNING_DATA].title;
            subTitle = LEARNING_DATA[selectedUnit as keyof typeof LEARNING_DATA].category;
        }
        if (selectedMedium) {
            mainTitle = `${mainTitle} - ${selectedMedium === 'english' ? 'English' : 'Tamil'}`;
            subTitle = 'Select a subject to begin';
        }

        return (
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    {(Platform.OS === 'web' || selectedUnit) && (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <ChevronLeft size={36} color={theme.text} />
                        </TouchableOpacity>
                    )}
                    <View>
                        <MotiText
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            style={[styles.headerTitle, { color: theme.text }]}
                        >
                            {mainTitle}
                        </MotiText>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            {subTitle}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderUnits = () => (
        <View style={styles.grid}>
            {UNITS.map((module, index) => {
                const Icon = module.icon;
                const isHovered = hoveredId === module.id;
                return (
                    <MotiView
                        key={module.id}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', delay: index * 100 }}
                        style={[styles.cardContainer, { width: isMobile ? '100%' : '48%' }]}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => handlePress(module.id, 'unit')}
                            {...(Platform.OS === 'web' ? {
                                onMouseEnter: () => setHoveredId(module.id),
                                onMouseLeave: () => setHoveredId(null)
                            } : {} as any)}
                            style={[
                                styles.premiumCard,
                                {
                                    backgroundColor: cardBg,
                                    borderColor: isHovered ? primaryTeal : borderCol,
                                    borderWidth: 2,
                                },
                                isHovered && styles.cardHovered
                            ]}
                        >
                            <LinearGradient
                                colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#0F172A' : '#F0F7F8' }]}>
                                        <Icon size={32} color={primaryTeal} />
                                    </View>
                                    <View style={styles.cardTitleSection}>
                                        <Text style={[styles.cardCategory, { color: primaryTeal }]}>{module.title}</Text>
                                        <Text style={[styles.cardTitle, { color: theme.text }]}>{module.category}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{module.description}</Text>
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.exploreText, { color: primaryTeal }]}>Explore Subjects</Text>
                                    <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                        <ArrowRight size={18} color={primaryTeal} />
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>
                );
            })}
        </View>
    );

    const renderMediums = () => (
        <View style={styles.grid}>
            {MEDIUMS.map((medium, index) => {
                const Icon = medium.icon;
                const isHovered = hoveredId === medium.id;
                return (
                    <MotiView
                        key={medium.id}
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', delay: index * 100 }}
                        style={[styles.cardContainer, { width: isMobile ? '100%' : '48%' }]}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => handlePress(medium.id, 'medium')}
                            {...(Platform.OS === 'web' ? {
                                onMouseEnter: () => setHoveredId(medium.id),
                                onMouseLeave: () => setHoveredId(null)
                            } : {} as any)}
                            style={[
                                styles.premiumCard,
                                {
                                    backgroundColor: cardBg,
                                    borderColor: isHovered ? primaryTeal : borderCol,
                                    borderWidth: 2,
                                    minHeight: 220,
                                },
                                isHovered && styles.cardHovered
                            ]}
                        >
                            <LinearGradient
                                colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
                                style={[styles.cardGradient, { justifyContent: 'center', alignItems: 'center' }]}
                            >
                                <View style={[styles.iconContainerLarge, { backgroundColor: isDarkMode ? '#0F172A' : '#F0F7F8' }]}>
                                    <Icon size={40} color={primaryTeal} />
                                </View>
                                <Text style={[styles.mediumTitle, { color: theme.text }]}>{medium.title}</Text>
                                <Text style={[styles.mediumDesc, { color: theme.textSecondary }]}>{medium.description}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>
                );
            })}
        </View>
    );

    const renderSubjects = () => {
        const subjects = LEARNING_DATA[selectedUnit as keyof typeof LEARNING_DATA].subjects;
        return (
            <View style={styles.subjectsContainer}>
                <View style={styles.subjectList}>
                    {subjects.map((subject, index) => {
                        const Icon = subject.icon;
                        const isHovered = hoveredId === subject.id;
                        return (
                            <MotiView
                                key={subject.id}
                                from={{ opacity: 0, translateX: -30 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ type: 'spring', delay: index * 100 }}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => handlePress(subject.id, 'subject')}
                                    {...(Platform.OS === 'web' ? {
                                        onMouseEnter: () => setHoveredId(subject.id),
                                        onMouseLeave: () => setHoveredId(null)
                                    } : {} as any)}
                                    style={[
                                        styles.subjectCard,
                                        {
                                            backgroundColor: cardBg,
                                            borderColor: isHovered ? primaryTeal : borderCol,
                                        },
                                        isHovered && styles.cardHovered
                                    ]}
                                >
                                    <View style={[styles.subjectIconBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F0F7F8' }]}>
                                        <Icon size={24} color={primaryTeal} />
                                    </View>
                                    <View style={styles.subjectInfo}>
                                        <Text style={[styles.subjectTitle, { color: theme.text }]}>{subject.title}</Text>
                                        <View style={styles.progressContainer}>
                                            <View style={[styles.progressBarBase, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]}>
                                                <MotiView 
                                                    from={{ width: 0 }}
                                                    animate={{ width: `${subject.progress * 100}%` }}
                                                    transition={{ type: 'timing', duration: 1000 }}
                                                    style={[styles.progressBarFill, { backgroundColor: primaryTeal }]} 
                                                />
                                            </View>
                                            <Text style={[styles.progressText, { color: theme.textSecondary }]}>{Math.round(subject.progress * 100)}%</Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={20} color={primaryTeal} />
                                </TouchableOpacity>
                            </MotiView>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
                    {renderHeader()}
                    <View style={styles.content}>
                        {!selectedUnit && renderUnits()}
                        {selectedUnit && !selectedMedium && renderMediums()}
                        {selectedUnit && selectedMedium && renderSubjects()}
                    </View>
                </SafeAreaView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    safeArea: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    header: {
        marginTop: Platform.OS === 'web' ? 40 : 20,
        marginBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        paddingRight: 16,
    },
    headerTitle: {
        fontSize: isDesktop ? 42 : 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.8,
    },
    content: {
        width: '100%',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 24,
    },
    cardContainer: {
        marginBottom: 8,
    },
    premiumCard: {
        borderRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 8 },
            web: { transition: 'all 0.3s ease-out' }
        }),
    },
    cardHovered: {
        ...Platform.select({
            web: { transform: [{ translateY: -8 }] } as any,
            default: {}
        })
    },
    cardGradient: {
        padding: 32,
        minHeight: 240,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerLarge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    cardTitleSection: {
        flex: 1,
        paddingTop: 4,
    },
    cardCategory: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 30,
    },
    cardDesc: {
        fontSize: 15,
        lineHeight: 24,
        marginVertical: 16,
        opacity: 0.7,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    exploreText: {
        fontSize: 14,
        fontWeight: '700',
    },
    arrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediumTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    mediumDesc: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    },
    subjectList: {
        gap: 16,
    },
    subjectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        ...Platform.select({
            web: { transition: 'all 0.2s ease' }
        })
    },
    subjectIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarBase: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        width: 35,
    },
    subjectsContainer: {
        gap: 32,
    },
    filesSection: {
        marginTop: 16,
    },
    filesHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    filesSectionTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    addFileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    addFileBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    fileList: {
        gap: 12,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
        ...Platform.select({
            web: { transition: 'all 0.2s ease' }
        })
    },
    fileName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    readOnlyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    readOnlyText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    }
});