import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../constants/colors';

export default function NotFoundScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🔍</Text>
            <Text style={styles.title}>Page Not Found</Text>
            <Text style={styles.subtitle}>{"The page you're looking for doesn't exist."}</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
                <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 },
    emoji: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '700' as const, color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24, textAlign: 'center' },
    button: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    buttonText: { color: colors.textLight, fontSize: 16, fontWeight: '600' as const },
});
