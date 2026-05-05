import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, Image, Platform } from 'react-native';
import {
    User, Settings, Bell, Book, Award, CreditCard, HelpCircle,
    LogOut, ChevronRight, Edit3, Trash2, EyeOff
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

const isWeb = Platform.OS === 'web';

export default function ProfileScreen() {
    const router = useRouter();
    const { theme, isDarkMode } = useTheme();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [incognitoMode, setIncognitoMode] = useState(false);

    const pageBg = theme.background;
    const cardBg = theme.surface;
    const borderCol = theme.border;

    const [userData, setUserData] = useState({
        name: "UPSC Aspirant",
        targetYear: "2026",
        optionalSubject: "Optional",
        bio: "Aiming for LBSNAA",
        attemptCount: "1",
        dailyGoal: "8h",
        homeState: "Not Set",
    });

    const menuItems = [
        { icon: Bell, label: 'Notifications', route: '/notifications' },
        { icon: Book, label: 'My Learning', route: '/learning' },
        { icon: Award, label: 'Achievements', route: '/achievements' },
        { icon: CreditCard, label: 'Subscription', route: '/subscription' },
        { icon: Settings, label: 'Settings', route: '/settings' },
        { icon: HelpCircle, label: 'Help & Support', route: '/support' },
    ];

    const avatarScale = useRef(new Animated.Value(0.9)).current;

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                try {
                    const savedData = await AsyncStorage.getItem('user_profile');
                    const savedImg = await AsyncStorage.getItem('user_avatar');
                    const savedIncognito = await AsyncStorage.getItem('incognito_mode');
                    if (savedData) setUserData(JSON.parse(savedData));
                    if (savedImg) setProfileImage(savedImg);
                    if (savedIncognito !== null) setIncognitoMode(JSON.parse(savedIncognito));
                } catch (e) { console.error(e); }
            };
            loadData();
        }, [])
    );

    useEffect(() => {
        Animated.spring(avatarScale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    }, []);

    const pickImage = async () => {
        // Request permissions first
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Please allow access to your photos to set a profile picture.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            await AsyncStorage.setItem('user_avatar', uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const removeImage = async () => {
        Alert.alert(
            "Remove Photo",
            "Are you sure you want to remove your profile picture?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setProfileImage(null);
                        await AsyncStorage.removeItem('user_avatar');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            ]
        );
    };

    // Navigation helper for Edit Profile
    const handleEditProfile = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/settings/editProfile');
    };

    return (
        <View style={[s.container, { backgroundColor: pageBg }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPadding}>

                {/* Incognito Banner */}
                {incognitoMode && (
                    <View style={[s.incognitoBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#1E293B' }]}>
                        <EyeOff size={16} color="#38BDF8" style={{ marginRight: 8 }} />
                        <Text style={s.incognitoText}>You are in Incognito Mode</Text>
                    </View>
                )}

                {/* Profile Header */}
                <View style={[s.headerSection, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                    <TouchableOpacity onPress={profileImage ? removeImage : pickImage} style={s.avatarWrapper}>
                        <Animated.View style={[s.avatarFrame, { transform: [{ scale: avatarScale }] }]}>
                            {profileImage ? (
                                <>
                                    <Image source={{ uri: profileImage }} style={s.avatarImg} />
                                    <TouchableOpacity style={s.trashIconBadge} onPress={removeImage}>
                                        <Trash2 size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={[s.avatarPlaceholder, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                                        <User size={40} color={isDarkMode ? '#94A3B8' : '#94A3B8'} />
                                    </View>
                                    {/* Trigger image picker when clicking the edit badge */}
                                    <TouchableOpacity style={s.editIconBadge} onPress={pickImage}>
                                        <Edit3 size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Make Name/Bio clickable to edit as well */}
                    <TouchableOpacity onPress={handleEditProfile} style={{ alignItems: 'center' }}>
                        <Text style={[s.userName, { color: theme.text }]}>{userData.name}</Text>
                        <Text style={[s.userBio, { color: theme.primary }]}>{userData.bio}</Text>
                    </TouchableOpacity>

                    {/* ADDED: Edit Profile Button */}
                    <TouchableOpacity
                        style={[s.editProfileBtn, { borderColor: theme.border || '#E2E8F0' }]}
                        onPress={handleEditProfile}
                    >
                        <Edit3 size={14} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={[s.editBtnText, { color: theme.primary }]}>Edit Profile</Text>
                    </TouchableOpacity>

                    <Text style={s.metaText}>{userData.targetYear}  •  {userData.optionalSubject}  •  Attempt {userData.attemptCount}</Text>

                    {/* Stats Grid */}
                    <View style={s.statsRow}>
                        <View style={[s.statCard, { backgroundColor: pageBg, borderColor: borderCol, borderWidth: 1 }]}>
                            <Text style={s.statLabel}>DAILY GOAL</Text>
                            <Text style={[s.statValue, { color: theme.text }]}>{userData.dailyGoal}</Text>
                        </View>
                        <View style={[s.statCard, { backgroundColor: pageBg, borderColor: borderCol, borderWidth: 1 }]}>
                            <Text style={s.statLabel}>STATE</Text>
                            <Text style={[s.statValue, { color: theme.text }]}>{userData.homeState}</Text>
                        </View>
                    </View>
                </View>

                {/* Account Menu */}
                <Text style={s.sectionTitle}>ACCOUNT MENU</Text>
                <View style={[s.menuBox, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: 1 }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[s.menuItem, index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderCol }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(item.route as any);
                            }}
                        >
                            <View style={s.menuLeft}>
                                <View style={[s.iconBg, { backgroundColor: pageBg }]}>
                                    <item.icon size={20} color={isDarkMode ? '#94A3B8' : '#475569'} />
                                </View>
                                <Text style={[s.menuLabel, { color: theme.text }]}>{item.label}</Text>
                            </View>
                            <ChevronRight size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={s.menuItem}
                        onPress={() => Alert.alert("Logout", "Ready for a break?", [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Logout",
                                style: 'destructive',
                                onPress: async () => {
                                    await AsyncStorage.removeItem('is_logged_in');
                                    router.replace('/login');
                                }
                            }
                        ])}
                    >
                        <View style={s.menuLeft}>
                            <View style={[s.iconBg, { backgroundColor: '#FEF2F2' }]}>
                                <LogOut size={20} color="#EF4444" />
                            </View>
                            <Text style={[s.menuLabel, { color: '#EF4444' }]}>Logout</Text>
                        </View>
                    </TouchableOpacity>
                </View>



            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    incognitoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginBottom: 20,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#38BDF8'
    },
    incognitoText: { color: '#38BDF8', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    scrollPadding: { paddingTop: 30, paddingBottom: 100, maxWidth: 1100, alignSelf: 'center', width: '100%', paddingHorizontal: isWeb ? '5%' : 20 },
    headerSection: { borderRadius: 32, padding: 24, alignItems: 'center', marginBottom: 25 },
    avatarWrapper: { marginBottom: 16 },
    avatarFrame: { width: 90, height: 90, borderRadius: 45, padding: 3, backgroundColor: '#E2E8F0' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 45 },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#334155', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    trashIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EF4444', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    userName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    userBio: { fontSize: 14, fontWeight: '600', marginTop: 4, opacity: 0.9 },

    // Edit Button Style
    editProfileBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginTop: 15, marginBottom: 5 },
    editBtnText: { fontSize: 13, fontWeight: '700' },

    metaText: { fontSize: 12, color: '#94A3B8', marginTop: 8, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
    statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '800' },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 12, marginLeft: 8 },
    menuBox: { borderRadius: 28, overflow: 'hidden', marginBottom: 25 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 15, fontWeight: '600' }
});