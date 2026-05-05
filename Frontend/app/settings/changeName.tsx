import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { User, ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ChangeNameScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const [name, setName] = useState('John Doe');
    const [loading, setLoading] = useState(false);

    const handleUpdateName = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Success", "Name updated!");
            router.back();
        }, 1500);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color={theme.primary} /></TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDarkMode ? theme.text : theme.accent }]}>Change Name</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>New Display Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <User size={20} color={theme.primary} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: theme.primary }]}
                    onPress={handleUpdateName}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Update Name</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'web' ? 30 : 60, paddingHorizontal: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: 25, marginTop: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 58, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 15 },
    input: { flex: 1, marginLeft: 12, fontSize: 16 },
    btn: { height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' }
});