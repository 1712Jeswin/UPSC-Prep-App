import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import {
  ChevronRight,
  Newspaper,
  PlayCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CloudUpload,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
} from "lucide-react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from 'expo-document-picker';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const isWeb = Platform.OS === "web";
const BUCKET = process.env.EXPO_PUBLIC_AWS_BUCKET_NAME || 'upsc-app';
const REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'eu-north-1';

// AWS S3 client configuration
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  }
});

// Available UPSC subject modules
const SUBJECT_OPTIONS = [
  { id: 'c1', title: 'Chemistry (GS I)' },
  { id: 'c2', title: 'Environment & Ecology (GS III)' },
  { id: 'c3', title: 'Life Science (GS III)' },
  { id: 'c4', title: 'Physical Science (GS III)' },
  { id: 'c5', title: 'Scientific Thinking (GS IV)' },
  { id: 'g1', title: 'Environment Geography (GS I)' },
  { id: 'g2', title: 'Human & Economic Geography (GS I)' },
  { id: 'g3', title: 'Physical Geography (GS I)' },
  { id: 'g4', title: 'Resource Geography (GS I)' },
  { id: 'g5', title: 'Social Geography (GS I)' },
];

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  // --- USER IDENTITY STATE ---
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
  const [adminName, setAdminName] = useState("Jenish");
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // --- STUDENT HOMEPAGE STATE ---
  const [liveArticles, setLiveArticles] = useState<any[]>([]);
  const fadeText = useRef(new Animated.Value(0)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;
  const fadeImage = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;
  const hasSpoken = useRef(false);

  // --- ADMIN WORKSPACE STATE ---
  const [editionType, setEditionType] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [forceDemo, setForceDemo] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Real-time live ingestion verification status
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    morning: 'PENDING' | 'PUBLISHED';
    morningTitle?: string;
    evening: 'PENDING' | 'PUBLISHED';
    eveningTitle?: string;
  }>({ morning: 'PENDING', evening: 'PENDING' });

  // Notes uploader states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('c1');
  const [isUploadingNotes, setIsUploadingNotes] = useState(false);
  const [notesUploadStatus, setNotesUploadStatus] = useState<string | null>(null);

  const primaryTeal = theme.primary;
  const cardBg = theme.surface;
  const borderCol = theme.border;

  // Load and verify role session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedData = await AsyncStorage.getItem('user_profile');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setUserRole(parsed.role || 'student');
          if (parsed.name) setAdminName(parsed.name);
        } else {
          setUserRole('student');
        }
      } catch (error) {
        setUserRole('student');
      } finally {
        setIsLoadingRole(false);
      }
    };
    loadSession();
  }, []);

  // Safe resolver for backend calls
  const getApiUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');
  };

  // --- REAL-TIME NEWS FETCH VERIFICATION ---
  const verifyLiveNews = async () => {
    setIsVerifying(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/articles`);
      if (!response.ok) throw new Error("Could not connect to service");
      
      const result = await response.json();
      if (result.success && result.data) {
        const todayStr = new Date().toDateString();
        
        // Look for today's morning and evening editions inside the Neon Database returned records
        const morningArticle = result.data.find(
          (a: any) => a.editionType === 'MORNING' && new Date(a.publishedDate).toDateString() === todayStr
        );
        const eveningArticle = result.data.find(
          (a: any) => a.editionType === 'EVENING' && new Date(a.publishedDate).toDateString() === todayStr
        );
        
        setVerificationStatus({
          morning: morningArticle ? 'PUBLISHED' : 'PENDING',
          morningTitle: morningArticle?.title || undefined,
          evening: eveningArticle ? 'PUBLISHED' : 'PENDING',
          eveningTitle: eveningArticle?.title || undefined,
        });
      }
    } catch (e) {
      console.log("Failed to verify live news status:", e);
      // Fallback cleanly
      setVerificationStatus({ morning: 'PENDING', evening: 'PENDING' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Run live verification upon admin loading
  useEffect(() => {
    if (userRole === 'admin') {
      verifyLiveNews();
    }
  }, [userRole]);

  // --- STUDENT: FETCH LIVE CURRENT AFFAIRS ---
  useEffect(() => {
    if (userRole !== 'admin') {
      const fetchLiveArticles = async () => {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/articles`);
          const result = await response.json();
          if (result.success && result.data) {
            setLiveArticles(result.data);
          }
        } catch (error) {
          console.log("Network disconnected or database empty (falling back to mock data offline).");
        }
      };
      fetchLiveArticles();

      // Student page micro-animations
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(fadeText, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(fadeButton, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeImage, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();

      if (!hasSpoken.current) {
        Speech.speak("Welcome Buddy", { language: "en-US", rate: 0.9 });
        hasSpoken.current = true;
      }
    }
  }, [userRole]);

  // --- ADMIN: INGEST NEWS AUTOMATION ---
  const triggerSync = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const token = await AsyncStorage.getItem('accessToken') || '';
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/admin/sync-news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          editionType: editionType,
          forceDemo: forceDemo
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSyncMessage(`Successfully Published: "${result.data?.article?.title || 'Daily Current Affairs'}" is now live!`);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Instantly re-verify news compilation
        verifyLiveNews();
        
        Alert.alert("Ingestion Success", `Successfully published the ${editionType} current affairs edition.`);
      } else {
        throw new Error(result.message || "Failed to compile the daily news.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Sync Failure", error.message || "Failed to connect to the news automation service.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- ADMIN: DATABASE LIFECYCLE SCRUBBING ---
  const triggerCleanup = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCleaning(true);

    try {
      const token = await AsyncStorage.getItem('accessToken') || '';
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/admin/cleanup`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Pruning Success", "Database cache and expired Better Auth sessions swept successfully.");
      } else {
        const result = await response.json();
        throw new Error(result.message || "Pruning failed.");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Cleanup Failure", error.message);
    } finally {
      setIsCleaning(false);
    }
  };

  // --- ADMIN: STUDY NOTES S3 UPLOADER ---
  const handleUploadNotes = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setIsUploadingNotes(true);
      setNotesUploadStatus(null);
      const asset = result.assets[0];

      // Convert file stream to Uint8Array for S3 compatibility in React Native
      const fetchResponse = await fetch(asset.uri);
      const blob = await fetchResponse.blob();
      const fileReader = new FileReader();
      const body: Uint8Array = await new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(new Uint8Array(fileReader.result as ArrayBuffer));
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(blob);
      });

      // Target path matches S3 listing prefixes inside course/[id].tsx
      const s3Key = `subject_${selectedSubjectId}/${Date.now()}_${asset.name}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: body,
        ContentType: asset.mimeType || 'application/octet-stream',
        ACL: 'public-read',
      }));

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotesUploadStatus(`Successfully uploaded notes: "${asset.name}"`);
      Alert.alert("Upload Success", `"${asset.name}" has been published to course subject [${selectedSubjectId.toUpperCase()}]!`);
    } catch (error: any) {
      console.error("Notes upload failed:", error);
      setNotesUploadStatus(`Upload failed: ${error.message || 'Check AWS configurations'}`);
      Alert.alert("Upload Error", error.message || "Failed to publish notes to S3.");
    } finally {
      setIsUploadingNotes(false);
    }
  };

  // --- ADMIN: LOG OUT ---
  const handleSignOut = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to exit the admin workspace?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('user_profile');
          router.replace('/login');
        }
      }
    ]);
  };

  // Render a clean activity loader while verifying the auth state
  if (isLoadingRole) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={primaryTeal} />
      </View>
    );
  }

  // ==========================================
  // RENDER INTERFACE 1: UPSC PLATFORM ADMINISTRATOR WORKSPACE
  // ==========================================
  if (userRole === 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.adminScrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Admin Custom Workspace Header */}
          <View style={[styles.adminHeader, { borderBottomColor: borderCol }]}>
            <View>
              <View style={styles.badgeRow}>
                <ShieldCheck size={20} color={primaryTeal} />
                <Text style={[styles.adminHeaderRole, { color: primaryTeal }]}>UPSC CURATOR PLATFORM</Text>
              </View>
              <Text style={[styles.adminHeaderName, { color: theme.text }]}>Welcome back, {adminName}!</Text>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, { borderColor: '#EF4444' }]}>
              <LogOut size={16} color="#EF4444" />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION 1: LIVE INGESTION STATUS CHECKER */}
          <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.adminCardHeader}>
              <Newspaper size={20} color={primaryTeal} />
              <Text style={[styles.adminCardTitle, { color: theme.text }]}>LIVE SYLLABUS & NEWS VERIFICATION TRACKER</Text>
              {isVerifying && <ActivityIndicator size="small" color={primaryTeal} style={{ marginLeft: 'auto' }} />}
            </View>
            <Text style={[styles.adminCardDesc, { color: theme.textSecondary }]}>
              Monitor the live Neon PostgreSQL database directly. Check below to verify if today's editions have been fetched, compiled by Gemini, and published.
            </Text>

            <View style={styles.trackerGrid}>
              
              {/* Morning Edition Status */}
              <View style={[styles.trackerCard, { backgroundColor: theme.background, borderColor: borderCol, minWidth: isMobile ? '100%' : '45%' }]}>
                <View style={styles.trackerHeader}>
                  <Text style={styles.trackerTime}>MORNING EDITION</Text>
                  {verificationStatus.morning === 'PUBLISHED' ? (
                    <View style={styles.statusBadgeGreen}>
                      <CheckCircle2 size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.statusBadgeText}>PUBLISHED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusBadgeAmber}>
                      <AlertCircle size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.statusBadgeText}>PENDING</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.trackerTitleText, { color: theme.text }]} numberOfLines={2}>
                  {verificationStatus.morningTitle || "Morning Current Affairs Ingestion Pending..."}
                </Text>
              </View>

              {/* Evening Edition Status */}
              <View style={[styles.trackerCard, { backgroundColor: theme.background, borderColor: borderCol, minWidth: isMobile ? '100%' : '45%' }]}>
                <View style={styles.trackerHeader}>
                  <Text style={styles.trackerTime}>EVENING EDITION</Text>
                  {verificationStatus.evening === 'PUBLISHED' ? (
                    <View style={styles.statusBadgeGreen}>
                      <CheckCircle2 size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.statusBadgeText}>PUBLISHED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusBadgeAmber}>
                      <AlertCircle size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.statusBadgeText}>PENDING</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.trackerTitleText, { color: theme.text }]} numberOfLines={2}>
                  {verificationStatus.eveningTitle || "Evening Current Affairs Ingestion Pending..."}
                </Text>
              </View>

            </View>

            <TouchableOpacity
              onPress={verifyLiveNews}
              disabled={isVerifying}
              style={[styles.verifyBtn, { borderColor: primaryTeal }]}
            >
              <RefreshCw size={16} color={primaryTeal} style={{ marginRight: 8 }} />
              <Text style={[styles.verifyBtnText, { color: primaryTeal }]}>Verify Live Database Ingest</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION 2: AUTOMATION NEWS SYNC LOOP */}
          <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.adminCardHeader}>
              <RefreshCw size={20} color={primaryTeal} />
              <Text style={[styles.adminCardTitle, { color: theme.text }]}>DAILY INGESTION AUTOMATION PANEL</Text>
            </View>
            <Text style={[styles.adminCardDesc, { color: theme.textSecondary }]}>
              Trigger news crawlers manually to compile structured current affairs analyses and practice quizzes.
            </Text>

            {/* Edition Segment Selector */}
            <Text style={[styles.adminLabel, { color: theme.textSecondary }]}>TARGET SYLLABUS EDITION</Text>
            <View style={styles.segmentContainer}>
              {(['MORNING', 'EVENING'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setEditionType(type)}
                  style={[
                    styles.segmentBtn,
                    editionType === type && { backgroundColor: primaryTeal, borderColor: primaryTeal }
                  ]}
                >
                  <Text style={[
                    styles.segmentText,
                    editionType === type ? { color: '#FFF', fontWeight: '800' } : { color: '#64748B' }
                  ]}>
                    {type} EDITION
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sandbox Testing Switch */}
            <View style={[styles.switchRow, { borderColor: borderCol }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.switchTitle, { color: theme.text }]}>Enable Ingestion Sandbox Mode</Text>
                <Text style={[styles.switchDesc, { color: theme.textSecondary }]}>
                  Enables simulated 1-minute news rotations for testing automation quizzes in real-time.
                </Text>
              </View>
              <Switch
                value={forceDemo}
                onValueChange={setForceDemo}
                trackColor={{ false: '#CBD5E1', true: primaryTeal }}
                thumbColor="#FFF"
              />
            </View>

            {syncMessage && (
              <View style={[styles.successBanner, { backgroundColor: isDarkMode ? '#1e293b' : '#EFF6F7', borderColor: primaryTeal }]}>
                <CheckCircle2 size={16} color={primaryTeal} style={{ marginRight: 8 }} />
                <Text style={[styles.successText, { color: theme.text }]} numberOfLines={2}>
                  {syncMessage}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={triggerSync}
              disabled={isSyncing}
              style={[styles.syncBtn, { backgroundColor: primaryTeal }]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <RefreshCw size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.syncBtnText}>Ingest and Sync News Content</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* SECTION 3: STUDY NOTES DIRECT S3 UPLOADER */}
          <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.adminCardHeader}>
              <CloudUpload size={20} color={primaryTeal} />
              <Text style={[styles.adminCardTitle, { color: theme.text }]}>SECURE S3 STUDY MATERIALS MANAGER</Text>
            </View>
            <Text style={[styles.adminCardDesc, { color: theme.textSecondary }]}>
              Publish read-only resource notes directly to courses. Select the subject module to begin.
            </Text>

            {/* Styled Subject Select Grid */}
            <Text style={[styles.adminLabel, { color: theme.textSecondary }]}>SELECT TARGET SYLLABUS COURSE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectSelectorContainer}>
              {SUBJECT_OPTIONS.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => setSelectedSubjectId(sub.id)}
                  style={[
                    styles.subjectSubBtn,
                    { borderColor: borderCol, backgroundColor: theme.background },
                    selectedSubjectId === sub.id && { borderColor: primaryTeal, backgroundColor: primaryTeal + '12' }
                  ]}
                >
                  <Text style={[
                    styles.subjectSubText,
                    { color: theme.textSecondary },
                    selectedSubjectId === sub.id && { color: primaryTeal, fontWeight: '800' }
                  ]}>
                    {sub.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {notesUploadStatus && (
              <View style={[styles.successBanner, { backgroundColor: isDarkMode ? '#1e293b' : '#EFF6F7', borderColor: borderCol }]}>
                <FileText size={16} color={primaryTeal} style={{ marginRight: 8 }} />
                <Text style={[styles.successText, { color: theme.text }]} numberOfLines={2}>
                  {notesUploadStatus}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleUploadNotes}
              disabled={isUploadingNotes}
              style={[styles.uploadNotesBtn, { backgroundColor: primaryTeal }]}
            >
              {isUploadingNotes ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <CloudUpload size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.syncBtnText}>Pick and Upload Study Notes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* SECTION 4: DATA LIFE CLEANER MAINTENANCE */}
          <View style={[styles.adminCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.adminCardHeader}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.adminCardTitle, { color: theme.text }]}>DATABASE GARBAGE COLLECTOR SWEEP</Text>
            </View>
            <Text style={[styles.adminCardDesc, { color: theme.textSecondary }]}>
              Manually trigger server sweeps to flush news raw cache older than 3 days, invalid browser state buffers, and expired user credentials.
            </Text>

            <TouchableOpacity
              onPress={triggerCleanup}
              disabled={isCleaning}
              style={[styles.cleanupBtn, { borderColor: '#EF4444' }]}
            >
              {isCleaning ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Trash2 size={18} color="#EF4444" style={{ marginRight: 8 }} />
                  <Text style={styles.cleanupBtnText}>Run Garbage Collector Sweep</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // RENDER INTERFACE 2: PREMIUM STUDENT UPSC DASHBOARD
  // ==========================================
  const responsiveStyles: any = {
    scrollContent: [styles.scrollContent, { paddingTop: isWeb ? 40 : 20 }],
    responsiveWrapper: [styles.responsiveWrapper, { paddingHorizontal: isWeb ? '5%' : 20 }],
    heroSection: [
      styles.heroSection,
      {
        flexDirection: (isWeb && width > 800) ? "row" : "column",
        paddingVertical: (isWeb && width > 800) ? 48 : 20,
        gap: (isWeb && width > 800) ? 48 : 16,
      } as const,
    ],
    welcomeText: [
      styles.welcomeText,
      {
        fontSize: (isWeb && width > 800) ? 16 : 12,
        marginBottom: (isWeb && width > 800) ? 16 : 8,
      },
    ],
    heroTitle: [
      styles.heroTitle,
      {
        fontSize: width > 800 ? 56 : 30,
        marginBottom: (isWeb && width > 800) ? 24 : 12,
        lineHeight: width > 800 ? 64 : 36,
      },
    ],
    heroSub: [
      styles.heroSub,
      {
        fontSize: width > 800 ? 18 : 13,
        lineHeight: width > 800 ? 28 : 20,
        marginBottom: (isWeb && width > 800) ? 32 : 16,
      },
    ],
    btnPrimary: [
      styles.btnPrimary,
      {
        paddingHorizontal: width > 800 ? 32 : 24,
        paddingVertical: width > 800 ? 16 : 12,
        minHeight: width > 800 ? 48 : 40,
      },
    ],
    btnPrimaryText: [styles.btnPrimaryText, { fontSize: width > 800 ? 16 : 14 }],
    heroImageContainer: [
      styles.heroImageContainer,
      {
        minHeight: width > 800 ? 450 : 200,
        marginTop: width > 800 ? 0 : 8,
      },
    ],
    heroImageWrapper: [
      styles.heroImageWrapper,
      {
        width: width > 800 ? 500 : "100%",
        height: width > 800 ? 380 : 180,
      },
    ],
    continueCard: [
      styles.continueCard,
      {
        flexDirection: width > 600 ? "row" : "column",
        alignItems: width > 600 ? "center" : "stretch",
      } as const,
    ],
    affairsGrid: [styles.affairsGrid, { flexDirection: width > 800 ? "row" : "column" } as const],
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={responsiveStyles.scrollContent}>
        <View style={responsiveStyles.responsiveWrapper}>
          
          {/* --- HERO SECTION --- */}
          <View style={responsiveStyles.heroSection}>
            <Animated.View style={[styles.heroTextContainer, { opacity: fadeText, transform: [{ translateY }] }]}>
              <Text style={[responsiveStyles.welcomeText, { color: primaryTeal }]}>WELCOME, STUDENT!</Text>
              <Text style={[responsiveStyles.heroTitle, { color: theme.text }]}>
                Master the UPSC Syllabus with <Text style={{ color: primaryTeal }}>Ethora</Text>
              </Text>
              <Text style={[responsiveStyles.heroSub, { color: theme.textSecondary }]}>
                Your all-in-one destination for{" "}
                <Text style={{ color: primaryTeal, fontWeight: "700" }} onPress={() => router.push("/current-affairs")}>
                  Daily Current Affairs
                </Text>
                , Subject Modules, and Realistic Mock Tests.
              </Text>

              <Animated.View style={{ opacity: fadeButton }}>
                <TouchableOpacity onPress={() => router.push("/learn")} style={[responsiveStyles.btnPrimary, { backgroundColor: primaryTeal }]}>
                  <Text style={responsiveStyles.btnPrimaryText}>Go to Course</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {Platform.OS === 'web' && (
              <Animated.View style={[responsiveStyles.heroImageContainer, { opacity: fadeImage }]}>
                <View style={responsiveStyles.heroImageWrapper}>
                  <Image
                    source={require("../../assets/images/emblem.png")}
                    style={{
                      width: width > 1200 ? 380 : 300,
                      height: width > 1200 ? 380 : 300,
                      tintColor: isDarkMode ? "#FFFFFF" : "#000000",
                    }}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>
            )}
          </View>

          {/* --- CONTINUE LEARNING SECTION --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PlayCircle size={24} color={primaryTeal} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 12 }]}>Continue Learning</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/learn")}
              style={[
                responsiveStyles.continueCard,
                {
                  backgroundColor: isDarkMode ? theme.surfaceAlt : "#F0F7F8",
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.continueCardContent}>
                <Text style={[styles.continueTag, { color: primaryTeal }]}>MODERN HISTORY</Text>
                <Text style={[styles.continueTitle, { color: theme.text }]}>The Revolt of 1857: Causes and Impact</Text>
                <View style={styles.continueMeta}>
                  <Clock size={14} color={theme.textSecondary} />
                  <Text style={[styles.continueMetaText, { color: theme.textSecondary }]}> 45 mins remaining</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push("/learn")} style={[styles.resumeBtn, { backgroundColor: primaryTeal }]}>
                <PlayCircle size={20} color="#FFF" />
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* --- DAILY AFFAIRS SECTION --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Newspaper size={24} color={primaryTeal} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 12 }]}>Daily Current Affairs</Text>
            </View>
            <View style={responsiveStyles.affairsGrid}>
              {liveArticles.length > 0 ? (
                liveArticles.map((article: any) => (
                  <TouchableOpacity
                    key={article.id}
                    onPress={() => router.push({
                      pathname: "/editorial-analyst",
                      params: { title: article.title }
                    })}
                    style={[styles.affairCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={[styles.dateBadge, { backgroundColor: isDarkMode ? theme.surfaceAlt : "#E0F2F1" }]}>
                        <Text style={[styles.dateText, { color: isDarkMode ? primaryTeal : "#00796B" }]}>
                          {new Date(article.publishedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.affairTitle, { color: theme.text }]} numberOfLines={2}>
                        {article.title}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 8 }} numberOfLines={3}>
                        {article.summary}
                      </Text>
                    </View>
                    <View style={[styles.cardFooter, { marginTop: 16 }]}>
                      <Text style={{ color: primaryTeal, fontWeight: "700" }}>Read Analysis</Text>
                      <ChevronRight size={16} color={primaryTeal} />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                [1, 2, 3].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => router.push("/current-affairs")}
                    style={[styles.affairCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={[styles.dateBadge, { backgroundColor: isDarkMode ? theme.surfaceAlt : "#E0F2F1" }]}>
                        <Text style={[styles.dateText, { color: isDarkMode ? primaryTeal : "#00796B" }]}>
                          March {item + 1}, 2026
                        </Text>
                      </View>
                      <Text style={[styles.affairTitle, { color: theme.text }]}>
                        Important Editorial Analysis: India's Foreign Policy
                      </Text>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={{ color: primaryTeal, fontWeight: "700" }}>Read Now</Text>
                      <ChevronRight size={16} color={primaryTeal} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

        </View>

        {Platform.OS === 'web' && (
          <View style={[styles.webInfoSection, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.webInfoTitle, { color: theme.text }]}>Experience the Best of Ethora</Text>
            <Text style={[styles.webInfoText, { color: theme.textSecondary }]}>
              Ethora is an all-in-one platform for UPSC aspirants. Read daily current affairs, complete structured syllabus modules, and track your progress in real-time.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  scrollContent: { flexGrow: 1 },
  responsiveWrapper: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 1100,
    paddingTop: 30,
    paddingBottom: 100
  },
  heroSection: { alignItems: "center" },
  heroTextContainer: { flex: 1 },
  welcomeText: { fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  heroTitle: { fontWeight: "900", letterSpacing: -1 },
  heroSub: { fontWeight: "400" },
  btnPrimary: { alignSelf: "flex-start", borderRadius: 12, elevation: 2, justifyContent: "center" },
  btnPrimaryText: { color: "#FFF", fontWeight: "800" },
  heroImageContainer: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  heroImageWrapper: { overflow: 'hidden' },
  section: { paddingVertical: 32 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  sectionTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  continueCard: { padding: 24, borderRadius: 16, borderWidth: 1, gap: 20 },
  continueCardContent: { flex: 1 },
  continueTag: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  continueTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12, lineHeight: 28 },
  continueMeta: { flexDirection: "row", alignItems: "center" },
  continueMetaText: { fontSize: 14, fontWeight: "600", marginLeft: 4 },
  resumeBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minHeight: 48, gap: 8, justifyContent: "center" },
  resumeBtnText: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  affairsGrid: { gap: 24 },
  affairCard: { flex: 1, padding: 24, borderRadius: 16, borderWidth: 1, minHeight: 200, display: "flex", flexDirection: "column" },
  dateBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  dateText: { fontSize: 12, fontWeight: "800" },
  affairTitle: { fontSize: 18, fontWeight: "800", lineHeight: 26, marginBottom: 24 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: "auto" },
  webInfoSection: { padding: 48, marginTop: 48, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  webInfoTitle: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  webInfoText: { fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 32, maxWidth: 640 },

  // ==========================================
  // ADMINISTRATOR CUSTOM WORKSPACE STYLE SHEET
  // ==========================================
  adminScrollContent: {
    paddingHorizontal: isWeb ? '18%' : 20,
    paddingTop: 30,
    paddingBottom: 80,
    maxWidth: isWeb ? 1600 : '100%',
    alignSelf: 'center',
    width: '100%',
    gap: 24,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminHeaderRole: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  adminHeaderName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  signOutBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },

  adminCard: { borderRadius: 24, borderWidth: 1, padding: 24 },
  adminCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  adminCardTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  adminCardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20, opacity: 0.85 },
  adminLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },

  // Live Ingest Verification styles
  trackerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  trackerCard: { flex: 1, padding: 18, borderRadius: 16, borderWidth: 1 },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trackerTime: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  statusBadgeGreen: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeAmber: { backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  trackerTitleText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  verifyBtn: { height: 48, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  verifyBtnText: { fontSize: 13, fontWeight: '800' },

  // News Ingestion controls
  segmentContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  segmentBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#CBD5E1' },
  segmentText: { fontSize: 12, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 20 },
  switchTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  switchDesc: { fontSize: 12, lineHeight: 16, opacity: 0.75 },
  successBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  successText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  syncBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  syncBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Notes uploader styles
  subjectSelectorContainer: { gap: 8, paddingBottom: 12, marginBottom: 16 },
  subjectSubBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  subjectSubText: { fontSize: 12, fontWeight: '600' },
  uploadNotesBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },

  // DB lifecycle sweeping
  cleanupBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1.5, backgroundColor: 'transparent' },
  cleanupBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 13 },
});
