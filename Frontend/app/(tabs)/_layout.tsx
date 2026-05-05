import { Tabs, router, usePathname, Link } from "expo-router";
import { Home, BookOpen, Newspaper, PenTool, User, LayoutGrid, Search, Flame, Target, CheckCircle2 } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, View, Text, StyleSheet, TouchableOpacity, TextInput, useWindowDimensions, ScrollView } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const isWeb = Platform.OS === 'web';

// Nav links constant
const NAV_LINKS = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Learn', path: '/learn', icon: BookOpen },
    { name: 'Affairs', path: '/current-affairs', icon: Newspaper },
    { name: 'Practice', path: '/practice', icon: PenTool },
    { name: 'Dashboard', path: '/syllabus-tracker', icon: LayoutGrid },
];

const SEARCH_DATABASE = [
    { id: '1', title: 'Indian Polity Course', type: 'Course', route: '/learn' },
    { id: '2', title: 'Daily Current Affairs', type: 'News', route: '/current-affairs' },
    { id: '3', title: 'Mock Tests & Practice', type: 'Practice', route: '/practice' },
    { id: '4', title: 'Syllabus Tracker', type: 'Tool', route: '/syllabus-tracker' },
    { id: '5', title: 'Detailed Editorial Analysis', type: 'News', route: '/current-affairs' },
    { id: '6', title: 'Geography Modules', type: 'Course', route: '/learn' },
];

// --- MOBILE/TABLET GLOBAL HEADER ---
function GlobalHeader() {
    const { theme, isDarkMode } = useTheme();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [hoveredNavIndex, setHoveredNavIndex] = useState<number | null>(null);

    const filteredResults = SEARCH_DATABASE.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={[styles.headerContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
            <View style={styles.headerContent}>

                {/* 1. LEFT: Logo */}
                <View style={styles.sideSection}>
                    <Link href="/" asChild>
                        <TouchableOpacity>
                            <Text style={[styles.logoText, { color: isDarkMode ? '#FFFFFF' : '#2D5A61' }]}>Ethora</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* 2. CENTER: Web Navigation (Centered) */}
                {isWeb && (
                    <View style={styles.centerSection}>
                        <View style={styles.webNav}>
                            {NAV_LINKS.map((item, index) => {
                                const isActive = pathname === item.path;
                                const isHovered = hoveredNavIndex === index;
                                return (
                                    <Link key={item.path} href={item.path as any} asChild>
                                        <TouchableOpacity
                                            // @ts-ignore - React Native Web supports these
                                            onMouseEnter={() => setHoveredNavIndex(index)}
                                            onMouseLeave={() => setHoveredNavIndex(null)}
                                            style={{
                                                transform: isHovered && !isActive ? [{ scale: 1.05 }] : [{ scale: 1 }],
                                            }}
                                        >
                                            <Text style={[
                                                styles.navLink,
                                                { color: isActive ? theme.primary : (isHovered ? theme.text : theme.textSecondary) }
                                            ]}>
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    </Link>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* 3. RIGHT: Search & Profile (Mobile & Web) */}
                <View style={[styles.sideSection, { alignItems: 'flex-end', zIndex: 999 }]}>
                    <View style={styles.headerRight}>
                        <View style={{ position: 'relative', zIndex: 1000 }}>
                            <View style={[styles.searchBar, { backgroundColor: '#F5F7F8' }]}>
                                <Search size={16} color="#9BA4AD" />
                                <TextInput
                                    placeholder="Search..."
                                    style={styles.searchInput}
                                    placeholderTextColor="#9BA4AD"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => {
                                        // Give time for onPress on results to register
                                        setTimeout(() => setIsSearchFocused(false), 200);
                                    }}
                                />
                            </View>

                            {/* Auto-suggest Dropdown */}
                            {isSearchFocused && searchQuery.length > 0 && (
                                <View style={[styles.searchResults, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
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
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity onPress={() => router.push('/profile')}>
                            <View style={styles.profileAvatar}>
                                <User size={18} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            </View>
        </View>
    );
}




// --- MAIN LAYOUT ---
export default function TabLayout() {
    const { theme, isDarkMode } = useTheme();
    const { width } = useWindowDimensions();

    // Breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    return (
        <View style={styles.appWrapper}>
            {/* Global Header for all devices */}
            <GlobalHeader />

            <View style={styles.mainContentRow}>
                {/* Center Content (Tabs Component) */}
                <View style={styles.centerTabsWrapper}>
                    <Tabs
                        screenOptions={{
                            tabBarActiveTintColor: isDarkMode ? "#FFFFFF" : "#2D5A61",
                            tabBarInactiveTintColor: theme.textSecondary,
                            headerShown: false,
                            tabBarStyle: {
                                backgroundColor: theme.surface,
                                borderTopColor: theme.border,
                                borderTopWidth: 1,
                                elevation: 0,
                                height: Platform.OS === 'ios' ? 90 : 70,
                                paddingBottom: Platform.OS === 'ios' ? 30 : 12,
                                paddingTop: 8,
                                display: (isWeb && isDesktop) ? 'none' : 'flex',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                            },
                            tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
                        }}
                    >
                        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
                        <Tabs.Screen name="learn" options={{ title: "Learn", tabBarIcon: ({ color }) => <BookOpen size={22} color={color} /> }} />
                        <Tabs.Screen name="current-affairs" options={{ title: "Affairs", tabBarIcon: ({ color }) => <Newspaper size={22} color={color} /> }} />
                        <Tabs.Screen name="practice" options={{ title: "Practice", tabBarIcon: ({ color }) => <PenTool size={22} color={color} /> }} />
                        <Tabs.Screen name="syllabus-tracker" options={{ title: "Dashboard", tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} /> }} />
                        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
                    </Tabs>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        borderBottomWidth: 1,
        zIndex: 1000,
        ...Platform.select({
            web: { height: 75, justifyContent: 'center' },
            default: { paddingTop: 50, paddingBottom: 15 }
        })
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: isWeb ? '5%' : 15,
        width: '100%',
    },
    sideSection: {
        flex: 1, // Forces left and right to equal sizes
    },
    centerSection: {
        flex: 2, // Gives middle nav more space
        alignItems: 'center',
    },
    logoText: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    webNav: {
        flexDirection: 'row',
        gap: 25,
    },
    navLink: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 12,
        width: isWeb ? 200 : 120, // Now visible on mobile
        height: 38,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        ...(isWeb ? { outlineStyle: 'none' } : {}) as any,
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
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2D5A61',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appWrapper: {
        flex: 1,
        flexDirection: 'column',
    },
    mainContentRow: {
        flex: 1,
        flexDirection: 'row',
    },
    centerTabsWrapper: {
        flex: 1,
        position: 'relative',
        maxWidth: isWeb ? 1200 : '100%',
        marginHorizontal: 'auto',
    },
    sidebarContainer: {
        width: 250,
        borderRightWidth: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    sidebarLogo: {
        padding: 32,
        paddingBottom: 24,
    },
    sidebarNav: {
        flex: 1,
        paddingHorizontal: 16,
        gap: 8,
    },
    sidebarNavItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 14,
    },
    sidebarNavText: {
        fontSize: 15,
        letterSpacing: 0.2,
    },
    sidebarFooter: {
        borderTopWidth: 1,
        borderColor: '#F1F5F9', // light border
        padding: 24,
    },
    profileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 14,
        fontWeight: '800',
    },
    profileSub: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    rightPanelContainer: {
        width: 300,
        borderLeftWidth: 1,
        height: '100%',
    },
    widgetCard: {
        width: '100%',
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    widgetTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    targetProgressWrap: {
        gap: 10,
    },
    targetProgressBg: {
        height: 8,
        borderRadius: 8,
        width: '100%',
    },
    targetProgressFill: {
        height: '100%',
        borderRadius: 8,
    },
    targetText: {
        fontSize: 12,
        fontWeight: '700',
        alignSelf: 'flex-end',
    },
    streakText: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    upcomingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    upcomingText: {
        fontSize: 14,
        fontWeight: '600',
    }
});