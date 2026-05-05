import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    ScrollView, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    Image,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { Send, Paperclip, Smile, Image as ImageIcon, ChevronLeft } from 'lucide-react-native'; 
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router'; 
import GlobalHeader from '../components/GlobalHeader';

const { width } = Dimensions.get('window');
const isMobile = width < 450;

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: string;
}

export default function SupportChatScreen() {
    const { theme, isDarkMode } = useTheme();
    const router = useRouter(); 
    const scrollViewRef = useRef<ScrollView>(null);
    
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: `Welcome, Machi. I am your Support Assistant. How can I facilitate your journey today?`,
            sender: 'bot',
            time: "10:00 AM"
        }
    ]);

    const handleSend = () => {
        if (message.trim().length === 0) return;
        const newUserMsg: Message = { 
            id: Date.now(), 
            text: message, 
            sender: 'user', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages(prev => [...prev, newUserMsg]);
        setMessage('');
        // Auto-scroll to bottom after message
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}>
            <GlobalHeader />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={s.cardWrapper}>
                        <View style={[s.chatCard, { backgroundColor: theme.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                            
                            {/* Mobile-Optimized Header */}
                            <View style={s.pageHeader}>
                                <View style={s.titleRow}>
                                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                                        <ChevronLeft size={isMobile ? 24 : 28} color={theme.text} />
                                    </TouchableOpacity>
                                    <Text style={[s.pageTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>
                                        Support
                                    </Text>
                                </View>
                                <Text style={[s.pageSubtitle, { color: theme.textSecondary }]}>
                                    Chat with our assistant
                                </Text>
                            </View>

                            <View style={[s.divider, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]} />

                            {/* Messages List */}
                            <View style={s.messageList}>
                                {messages.map((msg) => (
                                    <View key={msg.id} style={[s.messageRow, msg.sender === 'user' ? s.userRow : s.botRow]}>
                                        <View style={[
                                            s.bubble, 
                                            { 
                                                backgroundColor: msg.sender === 'bot' 
                                                    ? (isDarkMode ? '#1E293B' : '#F1F5F9') 
                                                    : '#4A767D',
                                                borderBottomLeftRadius: msg.sender === 'bot' ? 4 : 16,
                                                borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                                            }
                                        ]}>
                                            <Text style={[s.messageText, { color: msg.sender === 'bot' ? theme.text : '#FFFFFF' }]}>
                                                {msg.text}
                                            </Text>
                                            <Text style={[s.timeText, { color: msg.sender === 'bot' ? theme.textTertiary : 'rgba(255,255,255,0.7)' }]}>
                                                {msg.time}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Input Area */}
                            <View style={[s.inputSection, { borderTopColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                                <View style={[s.inputContainer, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                                    <TextInput
                                        style={[s.input, { color: theme.text }]}
                                        placeholder="Type a message..."
                                        placeholderTextColor={theme.textTertiary}
                                        value={message}
                                        onChangeText={setMessage}
                                        multiline
                                        maxLength={500}
                                    />
                                    <View style={s.inputActions}>
                                        { !isMobile && <TouchableOpacity style={s.iconBtn}><Paperclip size={20} color={theme.textTertiary} /></TouchableOpacity> }
                                        <TouchableOpacity 
                                            style={[s.sendBtn, { opacity: message.trim().length > 0 ? 1 : 0.6 }]} 
                                            onPress={handleSend}
                                            disabled={message.trim().length === 0}
                                        >
                                            <Send size={18} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        <Text style={[s.footerNote, { color: theme.textTertiary }]}>
                            © 2026 Ethora Support • <Text style={{ color: '#4A767D', fontWeight: '700' }}>Call Us</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        flexGrow: 1, 
        paddingBottom: 20 
    },
    cardWrapper: {
        width: isMobile ? '94%' : '100%',
        maxWidth: 800,
        alignSelf: 'center',
        paddingTop: isMobile ? 15 : 40,
        alignItems: 'center'
    },
    chatCard: { 
        width: '100%', 
        borderRadius: 20,
        borderWidth: 1,
        padding: isMobile ? 20 : 40,
        minHeight: isMobile ? 500 : 650,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12 },
            android: { elevation: 3 },
        }),
    },
    pageHeader: { marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -5 },
    backButton: { marginRight: 8, padding: 4 },
    pageTitle: { fontWeight: '900', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, marginTop: 2, marginLeft: isMobile ? 32 : 40, opacity: 0.8 },
    divider: { height: 1, marginBottom: 25 },
    messageList: { flex: 1, marginBottom: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 16 },
    botRow: { alignSelf: 'flex-start', paddingRight: 40 },
    userRow: { alignSelf: 'flex-end', paddingLeft: 40 },
    bubble: { 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderRadius: 16,
    },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    timeText: { fontSize: 10, marginTop: 4, textAlign: 'right', fontWeight: '600' },
    inputSection: { borderTopWidth: 1, paddingTop: 20 },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderRadius: 15, 
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    input: { flex: 1, fontSize: 14, maxHeight: 100, paddingRight: 10 },
    inputActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: { padding: 5 },
    sendBtn: { 
        backgroundColor: '#4A767D', 
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center', 
        justifyContent: 'center',
    },
    footerNote: { marginTop: 20, fontSize: 12, marginBottom: 30, textAlign: 'center' },
});