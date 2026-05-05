import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword) {
            return Alert.alert("Error", "Please fill in all fields");
        }

        setLoading(true);
        // Simulating API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Success", "Password changed successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
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
                    Security
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {/* Current Password */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>Current Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Lock size={20} color={theme.textTertiary} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={theme.textTertiary}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    style={styles.forgotContainer}
                >
                    <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* New Password */}
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>New Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ShieldCheck size={20} color={theme.primary} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        secureTextEntry
                        placeholder="Enter new password"
                        placeholderTextColor={theme.textTertiary}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: theme.primary }]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.btnText}>Confirm Change</Text>
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
        paddingTop: Platform.OS === 'web' ? 30 : 60,
        paddingHorizontal: 20,
        maxWidth: 600, width: '100%', alignSelf: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 25, marginTop: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 58,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 15
    },
    input: { flex: 1, marginLeft: 12, fontSize: 16 },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 10,
        paddingRight: 4
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '700',
    },
    btn: {
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        // Added shadow for a premium feel
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3
    },
    btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' }
});