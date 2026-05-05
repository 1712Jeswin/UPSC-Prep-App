import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Search, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { router, usePathname, Link } from 'expo-router';

const isWeb = Platform.OS === 'web';

const SEARCH_DATABASE = [
    { id: '1', title: 'Indian Polity Course', type: 'Course', route: '/learn' },
    { id: '2', title: 'Daily Current Affairs', type: 'News', route: '/current-affairs' },
    { id: '3', title: 'Mock Tests & Practice', type: 'Practice', route: '/practice' },
    { id: '4', title: 'Syllabus Tracker', type: 'Tool', route: '/syllabus-tracker' },
    { id: '5', title: 'Detailed Editorial Analysis', type: 'News', route: '/current-affairs' },
    { id: '6', title: 'Geography Modules', type: 'Course', route: '/learn' },
];

export default function GlobalHeader() {
    const { theme, isDarkMode } = useTheme();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const filteredResults = SEARCH_DATABASE.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Learn', path: '/learn' },
        { name: 'Affairs', path: '/current-affairs' },
        { name: 'Practice', path: '/practice' },
        { name: 'Dashboard', path: '/syllabus-tracker' },
    ];

    return (
        <View style={[styles.navbar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
            <View style={styles.navInner}>

                {/* LEFT: Logo */}
                <Link href="/" asChild>
                    <TouchableOpacity>
                        <Text style={[styles.logoText, { color: isDarkMode ? '#E2E8F0' : '#2D5A61' }]}>Ethora</Text>
                    </TouchableOpacity>
                </Link>

                {/* CENTER: Links (Visible only on Web) */}
                {isWeb && (
                    <View style={styles.centerSection}>
                        {navLinks.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link key={item.path} href={item.path as any} asChild>
                                    <TouchableOpacity>
                                        <Text style={[
                                            styles.navLink,
                                            { color: isActive ? (isDarkMode ? '#E2E8F0' : '#2D5A61') : theme.textSecondary }
                                        ]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                </Link>
                            );
                        })}
                    </View>
                )}

                {/* RIGHT: Search & Profile (Both Mobile & Web) */}
                <View style={[styles.rightSection, { zIndex: 999 }]}>
                    <View style={{ position: 'relative', zIndex: 1000 }}>
                        <View style={[styles.searchContainer, { backgroundColor: '#F5F7F8' }]}>
                            <Search size={16} color="#9BA4AD" />
                            <TextInput
                                placeholder="Search..."
                                style={styles.searchInput}
                                placeholderTextColor="#9BA4AD"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                        </View>

                        {/* Auto-suggest Dropdown */}
                        {isSearchFocused && searchQuery.length > 0 && (
                            <View style={[styles.searchResults, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                {filteredResults.length > 0 ? (
                                    filteredResults.map((result) => (
                                        <TouchableOpacity
                                            key={result.id}
                                            style={[styles.searchResultItem, { borderBottomColor: theme.border }]}
                                            onPress={() => {
                                                router.push(result.route as any);
                                                setSearchQuery('');
                                                setIsSearchFocused(false);
                                            }}
                                        >
                                            <View>
                                                <Text style={[styles.searchResultTitle, { color: theme.text }]}>{result.title}</Text>
                                                <Text style={[styles.searchResultType, { color: theme.textSecondary }]}>{result.type}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.searchResultEmpty}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>No results found</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <View style={styles.profileCircle}>
                            <User size={18} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        height: isWeb ? 70 : 100,
        paddingTop: isWeb ? 0 : 40,
        borderBottomWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: '4%',
        zIndex: 1000,
    },
    navInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    leftSection: {
        width: isWeb ? '20%' : 'auto',
        alignItems: 'flex-start',
    },
    centerSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 25,
        flex: 1, // Forces this to take all available middle space
    },
    rightSection: {
        width: isWeb ? '25%' : 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
    },
    logoText: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    navLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderRadius: 8,
        width: isWeb ? 180 : 110,
        height: 36,
    },
    searchInput: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
        ...Platform.select({ web: { outlineStyle: 'none' } as any }),
    },
    searchResults: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: 250,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 9999,
        overflow: 'hidden',
    },
    searchResultItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    searchResultTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    searchResultType: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    searchResultEmpty: {
        padding: 16,
        alignItems: 'center',
    },
    profileCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2D5A61',
        alignItems: 'center',
        justifyContent: 'center',
    },
});