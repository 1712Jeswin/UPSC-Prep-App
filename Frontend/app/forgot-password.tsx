import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ChevronLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetRequest = () => {
        if (!email.trim() || !email.includes('@')) {
            return Alert.alert("Invalid Email", "Please enter a valid email address.");
        }
        
        setLoading(true);
        // Simulating the email being sent
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Reset Link Sent", 
                "Check your inbox for instructions to reset your password.",
                [{ text: "Back to Login", onPress: () => router.replace('/login') }]
            );
        }, 2000);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronLeft size={28} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDarkMode ? theme.text : theme.accent }]}>
                    Reset Password
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.textSection}>
                    <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Mail size={20} color={theme.primary} />
                        <TextInput 
                            style={[styles.input, { color: theme.text }]} 
                            placeholder="name@example.com" 
                            placeholderTextColor={theme.textTertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                {/* Send Button */}
                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: theme.primary }]} 
                    onPress={handleResetRequest}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <View style={styles.btnContent}>
                            <Send size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.btnText}>Send Reset Link</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: 60, 
        paddingHorizontal: 20 
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 25, marginTop: 10 },
    textSection: { marginBottom: 30 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
    subtitle: { fontSize: 15, lineHeight: 22 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        height: 58, 
        borderWidth: 1.5, 
        borderRadius: 16, 
        paddingHorizontal: 15 
    },
    input: { flex: 1, marginLeft: 12, fontSize: 16 },
    btn: { 
        height: 58, 
        borderRadius: 18, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' }
});