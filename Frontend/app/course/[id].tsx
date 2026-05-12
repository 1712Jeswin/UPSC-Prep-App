import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Platform, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, Plus, FileText, Eye, Clock, BookOpen } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const BUCKET = process.env.EXPO_PUBLIC_AWS_BUCKET_NAME || 'upsc-app';
const REGION = process.env.EXPO_PUBLIC_AWS_REGION || 'eu-north-1';

const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
    }
});

interface FileItem {
    id: string;
    name: string;
    publicUrl: string; // Direct S3 URL — object is uploaded as public-read
    uploadedAt: number;
    size?: number;
    mimeType?: string;
}

function formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

export default function SubjectFilesScreen() {
    const { id } = useLocalSearchParams();
    const { theme, isDarkMode } = useTheme();

    const isDesktop = isWeb && width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [openingFileId, setOpeningFileId] = useState<string | null>(null);

    const fetchFiles = async () => {
        try {
            setIsLoading(true);
            const prefix = `subject_${id}/`;
            const command = new ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
            });

            const response = await s3Client.send(command);
            
            if (response.Contents) {
                const fetchedFiles: FileItem[] = response.Contents
                    .filter(obj => obj.Key !== prefix) // Filter out the "folder" itself if it exists
                    .map(obj => {
                        const key = obj.Key || '';
                        const name = key.split('/').pop() || 'Unnamed File';
                        // Clean up the timestamp prefix from the name for display
                        const cleanName = name.replace(/^\d+_/, '');
                        
                        return {
                            id: key,
                            name: cleanName,
                            publicUrl: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
                            uploadedAt: obj.LastModified ? obj.LastModified.getTime() : Date.now(),
                            size: obj.Size,
                        };
                    })
                    .sort((a, b) => b.uploadedAt - a.uploadedAt); // Newest first

                setFiles(fetchedFiles);
            } else {
                setFiles([]);
            }
        } catch (error) {
            console.error('Error fetching files from S3:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [id]);

    const handleAddFile = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'image/*'],
                copyToCacheDirectory: true
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            setIsUploading(true);
            const asset = result.assets[0];

            // Convert file to Uint8Array — avoids AWS SDK v3 stream issues in React Native
            const fetchResponse = await fetch(asset.uri);
            const blob = await fetchResponse.blob();
            const fileReader = new FileReader();
            const body: Uint8Array = await new Promise((resolve, reject) => {
                fileReader.onload = () => resolve(new Uint8Array(fileReader.result as ArrayBuffer));
                fileReader.onerror = reject;
                fileReader.readAsArrayBuffer(blob);
            });

            const s3Key = `subject_${id}/${Date.now()}_${asset.name}`;

            // Upload as public-read so the object is viewable via its direct URL.
            // The bucket's CORS policy already allows GET from any origin.
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: s3Key,
                Body: body,
                ContentType: asset.mimeType || 'application/octet-stream',
                // Makes the uploaded object publicly readable — no pre-signed URL needed.
                ACL: 'public-read',
            }));

            // Construct the direct, publicly-accessible S3 URL
            const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

            const newFile: FileItem = {
                id: Date.now().toString(),
                name: asset.name,
                publicUrl,
                uploadedAt: Date.now(),
                size: asset.size ?? undefined,
                mimeType: asset.mimeType ?? undefined,
            };
            setFiles(prev => [newFile, ...prev]);

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please check console for details.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenFile = async (file: FileItem) => {
        setOpeningFileId(file.id);
        try {
            // Open via Google Docs Viewer — renders as read-only, no download button shown.
            // Google's servers fetch the file server-side so CORS is not an issue here.
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.publicUrl)}&embedded=true`;
            await WebBrowser.openBrowserAsync(viewerUrl);
        } catch (error) {
            console.error('Error opening file:', error);
        } finally {
            setOpeningFileId(null);
        }
    };

    const cardBg = isDarkMode ? '#1a2540' : '#ffffff';
    const cardBorder = isDarkMode ? '#2d3a55' : '#e8edf5';
    const badgeBg = isDarkMode ? '#0f1c35' : '#eef2ff';
    const badgeText = isDarkMode ? '#93c5fd' : '#4f46e5';
    const metaBg = isDarkMode ? '#0d1929' : '#f8fafc';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>

            {/* ── Header ── */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <BookOpen size={18} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Study Materials</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={[
                    styles.contentWrapper,
                    isDesktop ? styles.desktopWrapper : isTablet ? styles.tabletWrapper : null,
                    { opacity: fadeAnim }
                ]}>

                    {/* ── Page heading ── */}
                    <View style={styles.pageHeaderRow}>
                        <View style={styles.pageHeadingBlock}>
                            <Text style={[styles.pageTitle, { color: theme.text }]}>Module Resources</Text>
                            <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                                {files.length === 0
                                    ? 'No materials yet — upload your first file.'
                                    : `${files.length} file${files.length !== 1 ? 's' : ''} available`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleAddFile}
                            disabled={isUploading}
                            style={[styles.addFileBtn, { backgroundColor: isUploading ? theme.primary + '90' : theme.primary }]}
                        >
                            {isUploading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : (<><Plus size={16} color="#fff" /><Text style={styles.addFileBtnText}>Upload</Text></>)
                            }
                        </TouchableOpacity>
                    </View>

                    {/* ── Upload progress banner ── */}
                    {isUploading && (
                        <View style={[styles.uploadingBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }]}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.uploadingText, { color: theme.primary }]}>Uploading to S3…</Text>
                        </View>
                    )}

                    {/* ── File list ── */}
                    <View style={styles.fileList}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 12 }]}>Loading materials...</Text>
                            </View>
                        ) : files.map((file) => {
                            const isOpening = openingFileId === file.id;
                            return (
                                <TouchableOpacity
                                    key={file.id}
                                    onPress={() => handleOpenFile(file)}
                                    disabled={isOpening}
                                    activeOpacity={0.75}
                                    style={[styles.fileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '18' }]}>
                                        <FileText size={26} color={theme.primary} />
                                    </View>

                                    <View style={styles.fileInfo}>
                                        <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={2}>
                                            {file.name.replace(/_/g, ' ')}
                                        </Text>
                                        <View style={[styles.metaRow, { backgroundColor: metaBg }]}>
                                            <Clock size={11} color={theme.textSecondary} />
                                            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                                {formatDate(file.uploadedAt)}
                                            </Text>
                                            {file.size && (
                                                <>
                                                    <Text style={[styles.metaDivider, { color: theme.textSecondary }]}>·</Text>
                                                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                                        {formatFileSize(file.size)}
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.rightCol}>
                                        <View style={[styles.readOnlyBadge, { backgroundColor: badgeBg }]}>
                                            <Text style={[styles.readOnlyText, { color: badgeText }]}>READ-ONLY</Text>
                                        </View>
                                        <View style={[styles.openBtn, { borderColor: theme.primary + '60', backgroundColor: theme.primary + '10' }]}>
                                            {isOpening
                                                ? <ActivityIndicator size="small" color={theme.primary} />
                                                : (<><Eye size={13} color={theme.primary} /><Text style={[styles.openBtnText, { color: theme.primary }]}>Open</Text></>)
                                            }
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ── Empty state ── */}
                    {!isLoading && files.length === 0 && !isUploading && (
                        <View style={[styles.emptyState, { borderColor: cardBorder, backgroundColor: cardBg }]}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '12' }]}>
                                <FileText size={40} color={theme.primary + 'aa'} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No files yet</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                Tap <Text style={{ fontWeight: '700', color: theme.primary }}>Upload</Text> to add PDFs or documents from your device.
                            </Text>
                        </View>
                    )}

                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'web' ? 16 : 14,
        borderBottomWidth: 1,
    },
    backButton: { padding: 6 },
    headerCenter: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    headerRight: { width: 40 },

    scrollContent: { paddingBottom: 80 },
    contentWrapper: { padding: 20 },
    tabletWrapper: { paddingHorizontal: 48 },
    desktopWrapper: { alignSelf: 'center', width: '100%', maxWidth: 860, paddingVertical: 36 },

    pageHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    pageHeadingBlock: { flex: 1, marginRight: 12 },
    pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
    pageSubtitle: { fontSize: 13, lineHeight: 18 },

    addFileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 28,
        gap: 6,
        minWidth: 100,
        justifyContent: 'center',
        ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } as any })
    },
    addFileBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    uploadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    uploadingText: { fontSize: 14, fontWeight: '600' },

    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600',
    },

    fileList: { gap: 14 },

    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        gap: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 2 },
            web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.18s ease' } as any
        }),
    },

    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    fileInfo: { flex: 1, gap: 8 },

    fileName: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 21,
        letterSpacing: 0.1,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    metaText: { fontSize: 11, fontWeight: '500' },
    metaDivider: { fontSize: 11 },

    rightCol: {
        alignItems: 'flex-end',
        gap: 8,
        flexShrink: 0,
    },

    readOnlyBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 6,
    },
    readOnlyText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    openBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 60,
        justifyContent: 'center',
    },
    openBtnText: { fontSize: 12, fontWeight: '700' },

    emptyState: {
        marginTop: 24,
        alignItems: 'center',
        padding: 48,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 280 },
});
