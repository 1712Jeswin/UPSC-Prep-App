import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, TextInput, TextStyle, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Sparkles, ChevronRight, User, Send, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlobalHeader from '../components/GlobalHeader'; 
import { MotiView } from 'moti';

const isWeb = Platform.OS === 'web';
const { width } = Dimensions.get('window');

const mockData = {
    syllabusPath: ["GS II", "Polity", "Judiciary"],
    publishedDate: "OCT 24, 2023",
    readingTime: "8 MINS",
    bannerImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000", 
    mentorNote: "Focus on the procedural sanctity of Constitutional Benches."
};

export default function EditorialAnalyst() {
    const { theme, isDarkMode } = useTheme();
    const { title } = useLocalSearchParams();
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState('PRELIMS');
    const [isTyping, setIsTyping] = useState(false);
    const [userInput, setUserInput] = useState('');
    
    const primaryTeal = isDarkMode ? '#5FA4AD' : '#2D5A61';

    const [messages, setMessages] = useState([
        { id: 1, type: 'mentor', text: mockData.mentorNote }
    ]);

    const tabContent = {
        PRELIMS: "Article 145(3) mandates a minimum of 5 judges for 'substantial questions of law'. For Prelims, remember: 1. It's a mandatory quorum. 2. CJI is the sole authority to constitute it. 3. This differs from a Division Bench (2) or Full Bench (3). Expect questions on the 'Master of Roster' doctrine.",
        MAINS: "In GS II, discuss the 'Constitutional Silence' on the timeframe for constituting such benches. You can argue that delay in forming 145(3) benches impacts fundamental rights. Contrast this with the 'Supreme Court of the United States' where the full court hears every case.",
        INTERVIEW: "If asked about judicial reforms, suggest a 'Permanent Constitution Bench' to prevent the CJI's administrative workload from delaying constitutional matters. Maintain a balanced view: while specialization helps, a rotating bench ensures varied judicial philosophies."
    };

    useEffect(() => {
        setIsTyping(true);
        const timer = setTimeout(() => {
            setIsTyping(false);
            const aiMsg = {
                id: Date.now(),
                type: 'ai',
                text: tabContent[activeTab as keyof typeof tabContent],
                label: `ANALYSIS • ${activeTab}`
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 600);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const handleSend = () => {
        if (!userInput.trim()) return;
        const newUserMsg = { id: Date.now(), type: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMsg]);
        setUserInput('');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const reply = { 
                id: Date.now() + 1, 
                type: 'ai', 
                text: "That's a sharp observation. Considering the 'Master of Roster' doctrine, how does this impact judicial independence?", 
                label: "AI FOLLOW-UP" 
            };
            setMessages(prev => [...prev, reply]);
        }, 1200);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <GlobalHeader />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Back Button & Breadcrumbs */}
                <View style={styles.headerNavRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={primaryTeal} />
                    </TouchableOpacity>
                    <View style={styles.breadcrumbContainer}>
                        {mockData.syllabusPath.map((p, i) => (
                            <Text key={i} style={[styles.breadcrumbText, { color: primaryTeal }]}>
                                {p}{i < mockData.syllabusPath.length - 1 ? "   /   " : ""}
                            </Text>
                        ))}
                    </View>
                </View>

                <Text style={[styles.mainTitle, { color: theme.text }]}>
                    {title || "Supreme Court clarifies Article 145(3) regarding Constitutional Benches"}
                </Text>
                
                <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>PUBLISHED: <Text style={{ color: theme.text }}>{mockData.publishedDate}</Text></Text>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>   •   READING TIME: <Text style={{ color: theme.text }}>{mockData.readingTime}</Text></Text>
                </View>

                {/* Tabs */}
                <View style={[styles.tabWrapper, { borderBottomColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                    {['PRELIMS', 'MAINS', 'INTERVIEW'].map((tab) => (
                        <TouchableOpacity 
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && { borderBottomColor: primaryTeal, borderBottomWidth: 3 }]}
                        >
                            <Text style={[styles.tabText, activeTab === tab ? { color: primaryTeal } : { color: '#94A3B8' }]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.bannerContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#334155' }]}>
                    <Image 
                        source={{ uri: mockData.bannerImageUrl }} 
                        style={styles.bannerImage} 
                        resizeMode="cover" 
                    />
                </View>

                {/* Chat AI Box */}
                <View style={[styles.chatBoxContainer, { 
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFF',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0'
                }]}>
                    <View style={[styles.chatBoxHeader, { 
                        borderBottomColor: isDarkMode ? '#334155' : '#F1F5F9',
                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC'
                    }]}>
                        <View style={styles.statusDot} />
                        <Text style={[styles.chatBoxHeaderTitle, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>ETHORA ANALYST AI</Text>
                        <Sparkles size={14} color={primaryTeal} />
                    </View>

                    <View style={styles.chatMessageArea}>
                        {messages.map((msg: any) => (
                            <View 
                                key={msg.id} 
                                style={msg.type === 'user' ? styles.chatBubbleRowUser : (msg.type === 'ai' ? styles.chatBubbleRowAI : styles.chatBubbleRowMentor)}
                            >
                                {msg.type !== 'user' && (
                                    <View style={[styles.chatAvatar, { backgroundColor: msg.type === 'ai' ? primaryTeal : '#64748B' }]}>
                                        {msg.type === 'ai' ? <Sparkles size={14} color="#FFF" /> : <User size={14} color="#FFF" />}
                                    </View>
                                )}
                                <View style={[
                                    msg.type === 'user' ? styles.bubbleUser : (msg.type === 'ai' ? styles.bubbleAI : styles.bubbleMentor),
                                    msg.type === 'ai' && isDarkMode && { backgroundColor: '#0F172A', borderColor: '#334155' },
                                    msg.type === 'mentor' && isDarkMode && { backgroundColor: '#334155' }
                                ]}>
                                    {msg.label && <Text style={[styles.aiLabel, { color: primaryTeal }]}>{msg.label}</Text>}
                                    <Text style={[
                                        msg.type === 'user' ? styles.bubbleTextUser : (msg.type === 'ai' ? styles.bubbleTextAI : styles.bubbleTextMentor),
                                        (msg.type === 'ai' || msg.type === 'mentor') && { color: theme.text }
                                    ]}>
                                        {msg.text}
                                    </Text>
                                </View>
                                {msg.type === 'user' && (
                                    <View style={[styles.chatAvatar, { backgroundColor: '#4A7C82' }]}><User size={14} color="#FFF" /></View>
                                )}
                            </View>
                        ))}
                    </View>

                    <View style={[styles.chatInputArea, { 
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFF',
                        borderTopColor: isDarkMode ? '#334155' : '#F1F5F9'
                    }]}>
                        <TextInput 
                            placeholder="Ask follow-up question..." 
                            style={[styles.chatInput, { color: theme.text }]}
                            placeholderTextColor="#94A3B8"
                            value={userInput}
                            onChangeText={setUserInput}
                            onSubmitEditing={handleSend}
                            {...Platform.select({ web: { outlineStyle: 'none' } } as any)}
                        />
                        <TouchableOpacity style={[styles.sendButton, { backgroundColor: primaryTeal }]} onPress={handleSend}>
                            <Send size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recall Card */}
                <MotiView 
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={[styles.recallCard, { backgroundColor: isDarkMode ? '#1E293B' : '#111827', borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }]}
                >
                    <Text style={styles.recallTitle}>Final Recall Check</Text>
                    <TouchableOpacity style={[styles.startQuizBtn, { backgroundColor: primaryTeal }]}>
                        <Text style={styles.startQuizText}>Start Quiz Now</Text>
                        <ChevronRight size={18} color="#FFF" />
                    </TouchableOpacity>
                </MotiView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        paddingHorizontal: isWeb ? '18%' : 20, 
        paddingTop: 20, 
        paddingBottom: 60,
        maxWidth: isWeb ? 1600 : '100%',
        alignSelf: 'center',
        width: '100%'
    },
    headerNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 12 },
    backBtn: { padding: 4 },
    breadcrumbContainer: { flexDirection: 'row', flex: 1 },
    breadcrumbText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    mainTitle: { fontSize: isWeb ? 32 : 24, fontWeight: '900', lineHeight: isWeb ? 40 : 32, marginBottom: 12 },
    metaRow: { flexDirection: 'row', marginBottom: 25 },
    metaLabel: { fontSize: 10, fontWeight: '700' },
    
    tabWrapper: { 
        flexDirection: 'row', 
        justifyContent: isWeb ? 'flex-start' : 'space-between',
        gap: isWeb ? 40 : 10, 
        borderBottomWidth: 1, 
        marginBottom: 30 
    },
    tab: { paddingBottom: 10, paddingHorizontal: 4, minWidth: isWeb ? 0 : 80, alignItems: 'center' },
    tabText: { fontSize: 12, fontWeight: '800' },
    
    bannerContainer: { width: '100%', height: isWeb ? 400 : 220, borderRadius: 24, overflow: 'hidden', marginBottom: 40 },
    bannerImage: { width: '100%', height: '100%' },

    chatBoxContainer: { 
        borderWidth: 1, 
        borderRadius: 24, 
        overflow: 'hidden',
        marginBottom: 40,
        ...Platform.select({ web: { boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' } })
    },
    chatBoxHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 10 },
    chatBoxHeaderTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginRight: 6 },
    chatMessageArea: { padding: isWeb ? 24 : 16, gap: 24 },
    chatBubbleRowMentor: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', width: '90%' },
    chatBubbleRowAI: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', alignSelf: 'flex-start', width: '90%' },
    chatBubbleRowUser: { flexDirection: 'row', gap: 12, alignItems: 'flex-end', alignSelf: 'flex-end', justifyContent: 'flex-end', width: '90%' },
    chatAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    bubbleMentor: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 18, borderBottomLeftRadius: 4, flexShrink: 1 },
    bubbleAI: { backgroundColor: '#F0F9F9', padding: 16, borderRadius: 18, borderBottomLeftRadius: 4, flexShrink: 1, borderWidth: 1, borderColor: '#CCECEE' },
    bubbleUser: { backgroundColor: '#2D5A61', padding: 16, borderRadius: 18, borderBottomRightRadius: 4, flexShrink: 1 },
    bubbleTextMentor: { fontSize: 15, lineHeight: 22 },
    bubbleTextAI: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
    bubbleTextUser: { fontSize: 15, color: '#FFF', lineHeight: 22 },
    aiLabel: { fontSize: 9, fontWeight: '900', marginBottom: 6 },
    chatInputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, alignItems: 'center', gap: 10 },
    chatInput: { flex: 1, height: 40, paddingHorizontal: 15, fontSize: 14 } as TextStyle,
    sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    recallCard: { 
        borderRadius: 24, 
        padding: 30, 
        alignItems: 'center', 
        flexDirection: isWeb ? 'row' : 'column', 
        justifyContent: 'space-between',
        gap: isWeb ? 0 : 20
    },
    recallTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', textAlign: isWeb ? 'left' : 'center' },
    startQuizBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingHorizontal: 24, 
        paddingVertical: 14, 
        borderRadius: 14, 
        gap: 8,
        width: isWeb ? 'auto' : '100%' 
    },
    startQuizText: { color: '#FFF', fontWeight: '800', fontSize: 15 }
});