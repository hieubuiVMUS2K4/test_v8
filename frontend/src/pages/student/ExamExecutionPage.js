import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, saveQuizResult } from '../../services/apiService';
import { useExamAutosave } from '../../hooks/useExamAutosave';
import styles from './ExamExecutionPage.module.css';

const QuizPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [subject, setSubject] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [examId, setExamId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize autosave hook - only when examId is available
  const {
    answers,
    updateAnswer,
    forceSave,
    isSaving,
    lastSaved,
    hasUnsavedChanges
  } = useExamAutosave(examId || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch exam questions using our updated API
        const quizData = await getQuiz(subjectId);

        // Debug logging
        console.log(`Loaded exam for subject ${subjectId}`);
        console.log('Quiz data:', quizData);
        console.log('Questions with savedAnswers:', quizData.questions?.map(q => ({
          id: q.id,
          savedAnswers: q.savedAnswers,
          answerMapping: q.answerMapping
        })));
        
        if (!quizData || !quizData.questions) {
          setError(`Không thể tải câu hỏi cho chuyên đề này.`);
          setLoading(false);
          return;
        }
        
        console.log(`Questions count: ${quizData.questions?.length || 0}`);

        // Set quiz data and examId
        setQuiz(quizData);
        setExamId(quizData.examId); // Set examId for autosave hook
        
        // Load saved answers if any
        const savedAnswers = {};
        if (quizData.questions) {
          console.log('Processing saved answers for questions:', quizData.questions.length);
          quizData.questions.forEach(question => {
            console.log(`Question ${question.id} savedAnswers:`, question.savedAnswers);
            if (question.savedAnswers && question.savedAnswers.length > 0) {
              // Convert A,B,C,D back to actual answer IDs for the autosave hook
              const actualAnswerIds = question.savedAnswers.map(letter => {
                const actualId = question.answerMapping[letter];
                console.log(`Converting ${letter} to ${actualId}`);
                return actualId;
              }).filter(id => id);
              
              if (actualAnswerIds.length > 0) {
                savedAnswers[question.id] = actualAnswerIds;
                console.log(`Set savedAnswers for question ${question.id}:`, actualAnswerIds);
              }
            }
          });
        }
        
        console.log('Final saved answers to load:', savedAnswers);
        
        // Initialize autosave hook with saved answers
        if (Object.keys(savedAnswers).length > 0) {
          // Update answers in the hook
          Object.keys(savedAnswers).forEach(questionId => {
            updateAnswer(questionId, savedAnswers[questionId]);
          });
        }
        
        // Set subject info from the quiz data
        const subjectData = quizData.topic || {};
        setSubject(subjectData);
        
        // Set time limit strictly from DB (duration_minutes -> timeLimit). No hardcoded fallback.
        if (subjectData && typeof subjectData.timeLimit === 'number') {
          setTimeLeft(subjectData.timeLimit * 60); // minutes -> seconds
        } else {
          console.warn('No time limit provided from backend; setting to 0');
          setTimeLeft(0);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error in QuizPage:', err);
        setError('Không thể tải bài thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, updateAnswer]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted]);

  const handleAnswerChange = (questionId, optionId, isMultiple = false) => {
    console.log('handleAnswerChange called:', { questionId, optionId, isMultiple, examId });
    
    if (isMultiple) {
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
      console.log('Multiple choice update:', { questionId, currentAnswers, newAnswers });
      updateAnswer(questionId, newAnswers);
    } else {
      console.log('Single choice update:', { questionId, optionId });
      updateAnswer(questionId, [optionId]);
    }
  };

  // Removed unused calculateScore helper (server returns score)

  // Handle back to subjects with autosave
  const handleBackToSubjects = async () => {
    try {
      // Force save current answers before leaving
      setLoading(true); // Show loading state
      await forceSave();
      console.log('Autosaved before leaving exam page');
      
      // Navigate back to subjects page
      navigate('/student/subjects');
    } catch (error) {
      console.error('Error saving before leaving:', error);
      setLoading(false);
      
      // Navigate anyway, but warn user
      const confirmLeave = window.confirm(
        'Không thể lưu trạng thái hiện tại. Bạn có chắc muốn quay lại không? Tiến trình có thể bị mất.'
      );
      if (confirmLeave) {
        navigate('/student/subjects');
      }
    }
  };

  // Improved handleSubmit to work with our new API
  const handleSubmit = async () => {
    if (!quiz || !quiz.questions || !quiz.questions.length || !subject) {
      console.log('Cannot submit quiz - missing data');
      return;
    }
    
    try {
      // Show loading state
      setLoading(true);
      
      console.log('Submitting answers:', answers);
      console.log('Exam ID:', quiz.examId);
      
  // Save result using the updated saveQuizResult function
  const result = await saveQuizResult(quiz.examId, { ...answers, topicId: subjectId });
      
      console.log('Exam submission successful:', result);
      
      // Lưu trạng thái hoàn thành vào localStorage
      const userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
      userProgress[subjectId] = { 
        passed: result.passed,
        score: result.score,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
      
      // Update the UI with the result
      setResult({
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        passScore: result.passScore || subject.passScore
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error saving quiz result:', error);
      alert('Có lỗi xảy ra khi lưu kết quả. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const question = quiz.questions[index];
    const hasAnswer = answers[question.id] && answers[question.id].length > 0;
    
    if (index === currentQuestion) return 'current';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => navigate('/student/subjects')}>Quay lại</button>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>Không tìm thấy bài thi.</p>
          <button onClick={() => navigate('/student/subjects')}>Quay lại</button>
        </div>
      </div>
    );
  }

  if (!loading && quiz && Array.isArray(quiz.questions) && quiz.questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-info-circle"></i>
            <p>Chuyên đề này hiện chưa có câu hỏi. Vui lòng quay lại sau.</p>
          <button onClick={() => navigate('/student/subjects')}>Quay lại</button>
        </div>
      </div>
    );
  }

  if (isSubmitted && result) {
    return (
      <div className={styles.container}>
        <div className={styles.resultContainer}>
          <div className={styles.resultCard}>
            <div className={`${styles.resultIcon} ${result.passed ? styles.passed : styles.failed}`}>
              <i className={result.passed ? 'fas fa-check-circle' : 'fas fa-times-circle'}></i>
            </div>
            
            <h2 className={styles.resultTitle}>
              {result.passed ? 'Chúc mừng! Bạn đã vượt qua bài thi' : 'Bạn chưa đạt điểm qua môn'}
            </h2>
            
            <div className={styles.scoreDisplay}>
              <div className={styles.mainScore}>{result.score}%</div>
              <div className={styles.scoreDetails}>
                {result.correctAnswers}/{result.totalQuestions} câu đúng
              </div>
            </div>
            
            <div className={styles.resultStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Điểm của bạn:</span>
                <span className={styles.statValue}>{result.score}%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Điểm qua môn:</span>
                <span className={styles.statValue}>{result.passScore}%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Kết quả:</span>
                <span className={`${styles.statValue} ${result.passed ? styles.passText : styles.failText}`}>
                  {result.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                </span>
              </div>
            </div>
            
            <div className={styles.resultActions}>
              {/* Always show the Back button regardless of result */}
              <button 
                className={styles.backBtn}
                onClick={() => navigate('/student/subjects')}
              >
                Quay lại danh sách môn học
              </button>
              
              {/* Only show retry button for students who failed */}
              {!result.passed && (
                <button 
                  className={styles.retryBtn}
                  onClick={() => window.location.reload()}
                >
                  Làm lại bài thi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra dữ liệu trước khi truy cập questions
  if (!quiz || !quiz.questions) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.subjectInfo}>
            <h1>{subject.name}</h1>
            <p>{subject.description}</p>
            <div className={styles.examMeta}>
              <span><i className="fas fa-clock"></i> Thời gian: {subject?.timeLimit ?? '--'} phút</span>
              <span><i className="fas fa-target"></i> Qua môn: {subject?.passScore ?? '--'}%</span>
              <span><i className="fas fa-question-circle"></i> Số câu: {quiz?.questions?.length || 0}</span>
            </div>
          </div>
          <div className={styles.timerSection}>
            <div className={styles.timer}>
              <i className="fas fa-clock"></i>
              <span className={timeLeft <= 300 ? styles.timeWarning : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>
            {/* Autosave indicator */}
            <div className={styles.autosaveStatus}>
              {isSaving && (
                <span className={styles.saving}>
                  <i className="fas fa-spinner fa-spin"></i> Đang lưu...
                </span>
              )}
              {hasUnsavedChanges && !isSaving && (
                <span className={styles.unsaved}>
                  <i className="fas fa-exclamation-circle"></i> Có thay đổi chưa lưu
                </span>
              )}
              {!hasUnsavedChanges && !isSaving && lastSaved && (
                <span className={styles.saved}>
                  <i className="fas fa-check-circle"></i> Đã lưu lúc {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.quizContent}>
        {/* Question Navigation */}
        <div className={styles.questionNav}>
          <h3>Câu hỏi</h3>
          <div className={styles.questionGrid}>
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                className={`${styles.questionNavBtn} ${styles[getQuestionStatus(index)]}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.current}`}></div>
              <span>Hiện tại</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.answered}`}></div>
              <span>Đã trả lời</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.unanswered}`}></div>
              <span>Chưa trả lời</span>
            </div>
          </div>
          {/* Nút nộp bài luôn hiển thị dưới danh sách câu hỏi */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            {/* Info text about autosave - simplified */}
            <div style={{ 
              fontSize: '13px', 
              color: '#666', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <i className="fas fa-save" style={{color: '#28a745', marginRight: '4px'}}></i>
              Tự động lưu mỗi 30 giây
            </div>
            
            {/* Submit button on top */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={loading || error || isSubmitted}
              >
                Nộp bài
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>

            {/* Back button on bottom - smaller */}
            <div style={{ textAlign: 'center' }}>
              <button
                className={styles.backBtnSmall}
                onClick={handleBackToSubjects}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-left"></i>
                    Quay lại
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className={styles.questionContent}>
          <div className={styles.questionHeader}>
            <span className={styles.questionNumber}>
              Câu {currentQuestion + 1}/{quiz.questions.length}
            </span>
            {/* Removed question type display */}
          </div>
          
          <div className={styles.questionText}>
            {currentQ.question}
          </div>
          
          <div className={styles.options}>
            {currentQ.options.map(option => (
              <label key={option.id} className={styles.optionLabel}>
                <input
                  type={(currentQ.type === 'multiple' || currentQ.type === 'multiple_choice' || currentQ.is_multiple_choice) ? 'checkbox' : 'radio'}
                  name={`question-${currentQ.id}`}
                  value={option.id}
                  checked={answers[currentQ.id]?.includes(option.id) || false}
                  onChange={() => handleAnswerChange(
                    currentQ.id, 
                    option.id, 
                    (currentQ.type === 'multiple' || currentQ.type === 'multiple_choice' || currentQ.is_multiple_choice)
                  )}
                />
                <span className={styles.optionText}>{option.text}</span>
              </label>
            ))}
          </div>
          
          <div className={styles.questionActions}>
            <button
              className={styles.prevBtn}
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <i className="fas fa-chevron-left"></i>
              <span>Pre</span>
            </button>
            <button
              className={styles.nextBtn}
              onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === quiz.questions.length - 1}
            >
              <span>Next</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;