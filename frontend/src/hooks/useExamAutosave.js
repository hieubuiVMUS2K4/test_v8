import { useState, useEffect, useCallback, useRef } from 'react';

// Get API base URL from config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

/**
 * Hook quản lý autosave cho bài thi
 * - Lưu tạm localStorage
 * - Sync server định kỳ
 * - Batch update thay vì mỗi click một request
 */
export const useExamAutosave = (examId, initialAnswers = {}) => {
  const [answers, setAnswers] = useState(initialAnswers);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef(null);
  const lastSavedAnswersRef = useRef(initialAnswers);
  
  // Key cho localStorage - chỉ tạo khi có examId
  const storageKey = examId ? `exam_${examId}_answers` : null;
  
  // Load từ localStorage khi component mount hoặc examId thay đổi
  useEffect(() => {
    if (!examId || !storageKey) return;
    
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed);
        lastSavedAnswersRef.current = parsed;
        console.log('Loaded saved answers from localStorage:', parsed);
      } catch (error) {
        console.error('Error loading saved answers:', error);
      }
    }
  }, [storageKey, examId]);
  
  // Lưu vào localStorage mỗi khi answers thay đổi
  useEffect(() => {
    if (!examId || !storageKey) return;
    
    localStorage.setItem(storageKey, JSON.stringify(answers));
    
    // Check if có thay đổi so với lần save cuối
    const hasChanges = JSON.stringify(answers) !== JSON.stringify(lastSavedAnswersRef.current);
    setHasUnsavedChanges(hasChanges);
    
    console.log('Answers updated:', answers, 'Has unsaved changes:', hasChanges);
    
  }, [answers, storageKey, examId]);
  
  // Hàm gửi lên server
  const syncToServer = useCallback(async (answersToSave) => {
    if (!examId) {
      console.log('Cannot sync - no examId');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Tính delta - chỉ gửi những thay đổi
      const delta = {};
      Object.keys(answersToSave).forEach(questionId => {
        const currentAnswer = answersToSave[questionId];
        const lastAnswer = lastSavedAnswersRef.current[questionId];
        
        if (JSON.stringify(currentAnswer) !== JSON.stringify(lastAnswer)) {
          delta[questionId] = currentAnswer;
        }
      });
      
      if (Object.keys(delta).length === 0) {
        console.log('No changes to sync');
        setIsSaving(false);
        return;
      }
      
      console.log('Syncing to server:', delta);
      
      // API call để autosave
      const response = await fetch(`${API_URL}/exams/${examId}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers: delta })
      });
      
      if (response.ok) {
        lastSavedAnswersRef.current = { ...answersToSave };
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        console.log('Autosave successful');
      } else {
        const errorText = await response.text();
        throw new Error(`Autosave failed: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Autosave error:', error);
      // Có thể hiển thị notification cho user
    } finally {
      setIsSaving(false);
    }
  }, [examId]);
  
  // Debounced autosave - chờ 30s sau thay đổi cuối
  useEffect(() => {
    if (!examId) return;
    
    if (hasUnsavedChanges) {
      // Clear timeout cũ
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      console.log('Setting autosave timeout (30s)...');
      
      // Set timeout mới
      saveTimeoutRef.current = setTimeout(() => {
        console.log('Autosave timeout triggered, syncing to server...');
        syncToServer(answers);
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, hasUnsavedChanges, syncToServer, examId]);
  
  // Force save ngay lập tức
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return syncToServer(answers);
  }, [answers, syncToServer]);
  
  // Update câu trả lời
  const updateAnswer = useCallback((questionId, selectedOptions) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptions
    }));
  }, []);
  
  // Clear localStorage khi submit xong
  const clearSavedData = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    answers,
    updateAnswer,
    forceSave,
    clearSavedData,
    isSaving,
    lastSaved,
    hasUnsavedChanges
  };
};
