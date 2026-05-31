import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import GlobalHeader from '../components/GlobalHeader';
import { ChevronRight, ArrowLeft, CheckCircle2, XCircle, Award, RefreshCw, HelpCircle, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const isWeb = Platform.OS === 'web';

interface Question {
  id: string;
  quizId: string;
  text: string;
  options: string[];
}

interface EvaluationResult {
  questionId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
}

interface SubQuizRef {
  quizId: string;
  title: string;
  passingScore: number;
  totalQuestions: number;
  startIndex: number;
}

export default function RecallQuizScreen() {
  const { theme, isDarkMode } = useTheme();
  const { articleId, articleIds } = useLocalSearchParams();
  const router = useRouter();

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz States
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1); // -1 represents the intro screen
  const [studentId, setStudentId] = useState<string | null>(null);

  // Consolidated Sub-Quiz References (to support chunks in grading)
  const [subQuizzes, setSubQuizzes] = useState<SubQuizRef[]>([]);

  // Review & Evaluation States
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    totalQuestions: number;
    passingScore: number;
    results: EvaluationResult[];
  } | null>(null);

  const primaryTeal = theme.primary;
  const cardBg = theme.surface;
  const borderCol = theme.border;

  // Safe resolver for backend API
  const getApiUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api');
  };

  useEffect(() => {
    const fetchSessionAndQuiz = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch student session ID to persist submissions if authenticated
        const savedData = await AsyncStorage.getItem('user_profile');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.id) setStudentId(parsed.id);
        }

        const apiUrl = getApiUrl();

        // 2. Core Loader Check: Cumulative mode vs Single mode
        if (articleIds) {
          // ==========================================
          // CUMULATIVE RECALL MODE (All Completed Articles)
          // ==========================================
          const ids = (articleIds as string).split(',').filter(Boolean);
          console.log(`[Cumulative Quiz] Loading pre-cached quizzes for ${ids.length} articles in parallel.`);

          const fetchPromises = ids.map(id => 
            fetch(`${apiUrl}/articles/${id}/quiz`)
              .then(res => {
                if (!res.ok) return null;
                return res.json();
              })
              .catch(e => {
                console.error(`Failed to load quiz for article ID ${id}:`, e);
                return null;
              })
          );

          const rawResults = await Promise.all(fetchPromises);
          const activeResults = rawResults.filter(Boolean);

          const consolidatedQuestions: Question[] = [];
          const loadedQuizzes: SubQuizRef[] = [];

          for (const result of activeResults) {
            if (result.success && result.data) {
              const quizRef = result.data;
              loadedQuizzes.push({
                quizId: quizRef.quizId,
                title: quizRef.title,
                passingScore: quizRef.passingScore || 3,
                totalQuestions: quizRef.totalQuestions || 5,
                startIndex: consolidatedQuestions.length
              });
              consolidatedQuestions.push(...(quizRef.questions || []));
            }
          }

          if (consolidatedQuestions.length === 0) {
            throw new Error("No active quizzes found for today's completed articles.");
          }

          setSubQuizzes(loadedQuizzes);
          setQuestions(consolidatedQuestions);
          setSelectedAnswers(new Array(consolidatedQuestions.length).fill(-1));

          // Compute composite daily quiz overview
          const compositePassing = loadedQuizzes.reduce((acc, q) => acc + q.passingScore, 0);
          setQuizDetails({
            quizId: "cumulative",
            title: "UPSC Daily Recall: Cumulative practice",
            passingScore: compositePassing,
            totalQuestions: consolidatedQuestions.length
          });

        } else if (articleId) {
          // ==========================================
          // STANDARD SINGLE-ARTICLE MODE
          // ==========================================
          const response = await fetch(`${apiUrl}/articles/${articleId}/quiz`);
          if (!response.ok) {
            throw new Error("Unable to retrieve recall quiz for this article.");
          }

          const result = await response.json();
          if (result.success && result.data) {
            const quizRef = result.data;
            setQuizDetails(quizRef);
            setQuestions(quizRef.questions || []);
            setSelectedAnswers(new Array(quizRef.questions.length).fill(-1));
            
            // Register single reference
            setSubQuizzes([{
              quizId: quizRef.quizId,
              title: quizRef.title,
              passingScore: quizRef.passingScore || 3,
              totalQuestions: quizRef.totalQuestions || 5,
              startIndex: 0
            }]);
          }
        } else {
          throw new Error("No article references provided for current quiz attempt.");
        }

      } catch (e: any) {
        console.error("Failed to load recall quiz:", e);
        Alert.alert("Quiz Unavailable", e.message || "No active recall quiz was found for these article parameters.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessionAndQuiz();
  }, [articleId, articleIds]);

  const handleSelectOption = (optionIndex: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedAnswers(prev => {
      const copy = [...prev];
      copy[currentQuestionIndex] = optionIndex;
      return copy;
    });
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrev = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentQuestionIndex > -1) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions are answered
    const unanswered = selectedAnswers.findIndex(ans => ans === -1);
    if (unanswered !== -1) {
      Alert.alert(
        "Incomplete Attempt",
        `You have not answered all questions. Question ${unanswered + 1} is pending.`,
        [{ text: "Return to Quiz" }]
      );
      setCurrentQuestionIndex(unanswered);
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = getApiUrl();

      // Submit each sub-quiz chunk in parallel to preserve backend schema integration
      const submissionPromises = subQuizzes.map((quizRef) => {
        const sliceStart = quizRef.startIndex;
        const sliceEnd = sliceStart + quizRef.totalQuestions;
        const sliceAnswers = selectedAnswers.slice(sliceStart, sliceEnd);
        
        return fetch(`${apiUrl}/quizzes/${quizRef.quizId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: sliceAnswers,
            studentId: studentId
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Server-side grading failed.");
          return res.json();
        })
        .catch(e => {
          console.error(`Submission failed for quiz ID ${quizRef.quizId}:`, e);
          return null;
        });
      });

      const rawSubmissions = await Promise.all(submissionPromises);
      const activeSubmissions = rawSubmissions.filter(Boolean);

      if (activeSubmissions.length !== subQuizzes.length) {
        throw new Error("Some answer slices failed server-side grading. Please try again.");
      }

      // Merge results dynamically into a single composite grading sheet
      let compositeScore = 0;
      let compositeTotal = 0;
      let compositePassing = 0;
      const compositeResults: EvaluationResult[] = [];

      for (const res of activeSubmissions) {
        if (res.success && res.data) {
          compositeScore += res.data.score;
          compositeTotal += res.data.totalQuestions;
          compositePassing += res.data.passingScore;
          compositeResults.push(...(res.data.results || []));
        }
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setQuizResult({
        score: compositeScore,
        passed: compositeScore >= compositePassing,
        totalQuestions: compositeTotal,
        passingScore: compositePassing,
        results: compositeResults
      });

    } catch (e: any) {
      console.error("Quiz submission error:", e);
      Alert.alert("Submission Failure", e.message || "Failed to compile quiz evaluations.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setCurrentQuestionIndex(-1);
    setQuizResult(null);
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={primaryTeal} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 12 }]}>Fetching Quiz Questions...</Text>
      </View>
    );
  }

  // ==========================================
  // VIEW MODE 1: EVALUATION & EXPLANATORY REVIEW VIEW
  // ==========================================
  if (quizResult) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <GlobalHeader />
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerNavRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={20} color={primaryTeal} />
            </TouchableOpacity>
            <Text style={[styles.headerBreadcrumb, { color: primaryTeal }]}>UPSC RECALL EVALUATION</Text>
          </View>

          {/* Composite Score Card */}
          <View style={[styles.resultCard, { backgroundColor: isDarkMode ? '#1E293B' : '#111827' }]}>
            <View style={styles.resultHeader}>
              <Award size={48} color={quizResult.passed ? "#10B981" : "#F59E0B"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{quizResult.passed ? "QUIZ PASSED!" : "KEEP PRACTICING!"}</Text>
                <Text style={styles.resultSub}>Composite Passing Goal: {quizResult.passingScore} / {quizResult.totalQuestions} Correct Answers</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.scoreRow}>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>YOUR COMPOSITE SCORE</Text>
                <Text style={[styles.scoreValue, { color: quizResult.passed ? "#10B981" : "#F59E0B" }]}>
                  {quizResult.score} <Text style={{ fontSize: 18, color: '#94A3B8' }}>/ {quizResult.totalQuestions}</Text>
                </Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreLabel}>ACCURACY RATIO</Text>
                <Text style={styles.scoreValue}>
                  {Math.round((quizResult.score / quizResult.totalQuestions) * 100)}%
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleRetake} style={[styles.retakeBtn, { backgroundColor: primaryTeal }]}>
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retakeBtnText}>Retake Practice Test</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionHeadingText, { color: theme.text }]}>Syllabus Competency Review</Text>
          <Text style={[styles.sectionSubtitleText, { color: theme.textSecondary }]}>
            Analyze every answer option below. The explanations are retrieved directly from the pre-cached database quizzes generated by the curator.
          </Text>

          {/* Explanatory Review Cards */}
          <View style={styles.reviewList}>
            {quizResult.results.map((q, idx) => (
              <View key={q.questionId} style={[styles.reviewCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                
                <View style={styles.reviewHeaderRow}>
                  <View style={[styles.questionNoCircle, { backgroundColor: theme.background }]}>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>{idx + 1}</Text>
                  </View>
                  {q.isCorrect ? (
                    <View style={styles.badgeCorrect}>
                      <CheckCircle2 size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeText}>CORRECT</Text>
                    </View>
                  ) : (
                    <View style={styles.badgeIncorrect}>
                      <XCircle size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeText}>INCORRECT</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.reviewQuestionText, { color: theme.text }]}>{q.text}</Text>

                {/* Option Buttons */}
                <View style={styles.optionsList}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = q.selectedOptionIndex === oIdx;
                    const isCorrectOption = q.correctOptionIndex === oIdx;

                    let btnStyle = { borderColor: borderCol, backgroundColor: theme.background };
                    let textStyle = { color: theme.text };

                    if (isCorrectOption) {
                      btnStyle = { borderColor: '#10B981', backgroundColor: '#10B98115' };
                      textStyle = { color: '#10B981' };
                    } else if (isSelected && !q.isCorrect) {
                      btnStyle = { borderColor: '#EF4444', backgroundColor: '#EF444415' };
                      textStyle = { color: '#EF4444' };
                    }

                    return (
                      <View key={oIdx} style={[styles.optionReviewBtn, btnStyle]}>
                        <Text style={[styles.optionNoText, textStyle, { fontWeight: '800' }]}>
                          {String.fromCharCode(65 + oIdx)}.
                        </Text>
                        <Text style={[styles.optionLabelText, textStyle]}>{opt}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Database-stored Explanatory Justification card */}
                <View style={[styles.explanationBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: borderCol }]}>
                  <View style={styles.explanationHeader}>
                    {q.isCorrect ? (
                      <>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={[styles.explanationHeaderTitle, { color: '#10B981' }]}>CORRECT ANSWER JUSTIFICATION</Text>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} color="#EF4444" />
                        <Text style={[styles.explanationHeaderTitle, { color: '#EF4444' }]}>WHY IT IS WRONG</Text>
                      </>
                    )}
                  </View>
                  <Text style={[styles.explanationText, { color: theme.textSecondary }]}>
                    {q.explanation}
                  </Text>
                </View>

              </View>
            ))}
          </View>

        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW MODE 2: ACTIVE RECALL PRACTICE QUIZ VIEW
  // ==========================================
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <GlobalHeader />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerNavRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={primaryTeal} />
          </TouchableOpacity>
          <Text style={[styles.headerBreadcrumb, { color: primaryTeal }]}>UPSC RECALL PRACTICE</Text>
        </View>

        {/* Intro / Welcome Screen */}
        {currentQuestionIndex === -1 ? (
          <View style={[styles.introCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.iconFrame, { backgroundColor: primaryTeal + '15' }]}>
              <HelpCircle size={40} color={primaryTeal} />
            </View>
            <Text style={[styles.introTitle, { color: theme.text }]}>{quizDetails?.title || "Daily Current Affairs Practice"}</Text>
            <Text style={[styles.introDesc, { color: theme.textSecondary }]}>
              Challenge your recall capability! This exam evaluates key facts, constitutional clauses, RBI regulatory frameworks, and treaties compiled in today's daily current affairs reading list.
            </Text>

            <View style={styles.introRulesBox}>
              <View style={styles.ruleRow}>
                <FileText size={16} color={primaryTeal} />
                <Text style={[styles.ruleText, { color: theme.text }]}>Total Questions: {questions.length} composite MCQs</Text>
              </View>
              <View style={styles.ruleRow}>
                <Award size={16} color={primaryTeal} />
                <Text style={[styles.ruleText, { color: theme.text }]}>Composite Passing goal: {quizDetails?.passingScore} / {questions.length} Correct Answers</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setCurrentQuestionIndex(0)} style={[styles.startBtn, { backgroundColor: primaryTeal }]}>
              <Text style={styles.startBtnText}>Start Practice Quiz</Text>
              <ChevronRight size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.quizFlowCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            
            {/* Progress Bar Header */}
            <View style={styles.progressHeader}>
              <Text style={[styles.progressIndicatorText, { color: theme.textSecondary }]}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#0F172A' : '#E2E8F0' }]}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: primaryTeal }]} />
              </View>
            </View>

            {/* Question Text */}
            <Text style={[styles.questionText, { color: theme.text }]}>
              {currentQuestion?.text}
            </Text>

            {/* Option Buttons */}
            <View style={styles.optionsList}>
              {currentQuestion?.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                return (
                  <TouchableOpacity
                    key={oIdx}
                    onPress={() => handleSelectOption(oIdx)}
                    activeOpacity={0.8}
                    style={[
                      styles.optionBtn,
                      { borderColor: borderCol, backgroundColor: theme.background },
                      isSelected && { borderColor: primaryTeal, backgroundColor: primaryTeal + '10' }
                    ]}
                  >
                    <View style={[
                      styles.optionSelectorNo,
                      { backgroundColor: isDarkMode ? '#0F172A' : '#EFF6F7' },
                      isSelected && { backgroundColor: primaryTeal }
                    ]}>
                      <Text style={[
                        styles.optionNoChar,
                        { color: theme.text },
                        isSelected && { color: '#FFF', fontWeight: '800' }
                      ]}>
                        {String.fromCharCode(65 + oIdx)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionLabelText,
                      { color: theme.text },
                      isSelected && { color: primaryTeal, fontWeight: '700' }
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Navigation buttons */}
            <View style={styles.navButtonsRow}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity onPress={handlePrev} style={[styles.prevBtn, { borderColor: borderCol }]}>
                  <Text style={[styles.prevBtnText, { color: theme.text }]}>Back</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === -1 || isSubmitting}
                style={[
                  styles.nextBtn,
                  { backgroundColor: primaryTeal },
                  selectedAnswers[currentQuestionIndex] === -1 && { opacity: 0.5 }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>
                      {currentQuestionIndex === questions.length - 1 ? "Submit Answers" : "Next Question"}
                    </Text>
                    <ChevronRight size={16} color="#FFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  scrollContent: {
    paddingHorizontal: isWeb ? '20%' : 20,
    paddingTop: 20,
    paddingBottom: 80,
    maxWidth: isWeb ? 1300 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  headerNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  headerBreadcrumb: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  // Intro Screen styles
  introCard: { borderRadius: 24, borderWidth: 1, padding: 30, alignItems: 'center' },
  iconFrame: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  introTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 },
  introDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24, opacity: 0.8 },
  introRulesBox: { width: '100%', padding: 20, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#CBD5E1', marginBottom: 30, gap: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleText: { fontSize: 13, fontWeight: '700' },
  startBtn: { height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, gap: 8 },
  startBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  // Quiz active flow styles
  quizFlowCard: { borderRadius: 24, borderWidth: 1, padding: 24 },
  progressHeader: { marginBottom: 24 },
  progressIndicatorText: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  progressBarBg: { height: 6, borderRadius: 3, width: '100%' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  questionText: { fontSize: 18, fontWeight: '800', lineHeight: 26, marginBottom: 24 },
  optionsList: { gap: 12, marginBottom: 30, width: '100%' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5 },
  optionSelectorNo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionNoChar: { fontSize: 12, fontWeight: '700' },
  optionLabelText: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  navButtonsRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  prevBtn: { height: 46, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  prevBtnText: { fontWeight: '700', fontSize: 14 },
  nextBtn: { height: 46, borderRadius: 12, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Review & Evaluation view styles
  resultCard: { borderRadius: 24, padding: 24, marginBottom: 30 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  resultTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  resultSub: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  scoreRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  scoreBlock: { flex: 1 },
  scoreLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  scoreValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  retakeBtn: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  retakeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  sectionHeadingText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  sectionSubtitleText: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  reviewList: { gap: 20 },
  reviewCard: { borderRadius: 24, borderWidth: 1, padding: 20 },
  reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  questionNoCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeCorrect: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIncorrect: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  reviewQuestionText: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 20 },
  optionReviewBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  optionNoText: { fontSize: 12, marginRight: 10 },
  explanationBox: { marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  explanationHeaderTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  explanationText: { fontSize: 13, lineHeight: 19, fontWeight: '500' }
});
