import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AISettings from './AISettings';

const SERVER = (import.meta.env.VITE_SERVER_URL) || 'http://localhost:4000';

export default function StudyRoom(){
  console.log('🚀 StudyRoom component loaded');
  const { user: authUser, apiCall } = useAuth();
  console.log('🔍 AuthUser from context:', authUser);
  const [room, setRoom] = useState('default-room');
  const [user, setUser] = useState(() => authUser?.username || 'User' + Math.floor(Math.random()*999));

  // Update user when authUser changes
  useEffect(() => {
    if (authUser?.username) {
      setUser(authUser.username);
    }
  }, [authUser]);
  const [notes, setNotes] = useState('');
  const [prompt, setPrompt] = useState('');
  
  // Study Features State
  const [activeTab, setActiveTab] = useState('ai');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [studyStats, setStudyStats] = useState({
    sessionsCompleted: 0,
    totalStudyTime: 0
  });
  const [showAISettings, setShowAISettings] = useState(false);
  
  // AI Assistant State
  const [aiResponses, setAiResponses] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Saved Notes State
  const [savedNotes, setSavedNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(SERVER);
    const s = socketRef.current;

    s.on('connect', () => console.log('connected', s.id));
    s.on('notes-update', ({notes}) => setNotes(notes));

    // join
    s.emit('join-room', { room, user });

    return () => s.disconnect();
  }, [room, user]);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsTimerRunning(false);
            setStudyStats(prev => ({
              ...prev,
              sessionsCompleted: prev.sessionsCompleted + 1,
              totalStudyTime: prev.totalStudyTime + timerMinutes
            }));
            // Play notification sound or show alert
            alert('🎉 Study session completed! Great job!');
            return timerMinutes * 60; // Reset timer
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (!isTimerRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMinutes]);

  // Load saved notes from database when user is authenticated
  const loadSavedNotes = async () => {
    if (!authUser || !apiCall) return;
    
    try {
      const response = await apiCall('/api/notes');
      if (response.ok) {
        const notes = await response.json();
        setSavedNotes(notes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  useEffect(() => {
    loadSavedNotes();
  }, [authUser]);

  const updateNotes = (newNotes) => {
    setNotes(newNotes);
    socketRef.current.emit('notes-update', { room, notes: newNotes });
  };

  // Simple Save Notes Function
  const saveCurrentNotes = () => {
    try {
      console.log('=== SAVE NOTES DEBUG ===');
      console.log('Auth user:', authUser);
      console.log('Notes content:', notes);
      console.log('Note title:', noteTitle);
      
      // Check if user is logged in
      if (!authUser) {
        alert('Please log in first to save notes');
        return;
      }
      
      // Check if there are notes to save
      const content = notes.trim();
      if (!content) {
        alert('Please write some notes before saving');
        return;
      }
      
      // Use note title from input or generate one
      const title = noteTitle.trim() || `My Notes - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      
      console.log('Final title:', title);
      console.log('Final content length:', content.length);
      
      // Actually save the note
      saveNoteToDatabase(title, content);
      
      // Clear the title after saving
      setNoteTitle('');
      
    } catch (error) {
      alert('Error in save function: ' + error.message);
      console.error('Save error:', error);
    }
  };
  
  const saveNoteToDatabase = async (title, content) => {
    try {
      console.log('Saving note to database...');
      console.log('Auth user:', authUser);
      
      if (!authUser) {
        alert('Please log in to save notes.');
        return;
      }
      
      // Get token from localStorage directly
      const token = localStorage.getItem('study-sync-token');
      console.log('Token found:', !!token);
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      
      console.log('Sending request to save note...');
      console.log('Title:', title);
      console.log('Content length:', content.length);
      console.log('Room:', room);
      
      const response = await fetch('http://localhost:4000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          content: content,
          studyRoom: room
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const savedNote = await response.json();
        alert('✅ Note saved successfully!');
        console.log('Saved note:', savedNote);
        
        // Add to saved notes list
        setSavedNotes(prev => [...prev, savedNote]);
        
        // Refresh the saved notes
        loadSavedNotes();
      } else {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { error: errorText };
        }
        
        alert('❌ Failed to save: ' + (error.error || error.message || 'Unknown error'));
        console.log('Parsed error:', error);
      }
    } catch (error) {
      alert('❌ Network error: ' + error.message);
      console.error('Database save error:', error);
    }
  };

  const loadSavedNote = (noteId) => {
    const note = savedNotes.find(n => n.id === noteId);
    if (note) {
      setNotes(note.content);
      setSelectedNoteId(noteId);
      socketRef.current.emit('notes-update', { room, notes: note.content });
    }
  };

  const deleteSavedNote = (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = savedNotes.filter(n => n.id !== noteId);
      setSavedNotes(updatedNotes);
      
      // Save to localStorage for persistence
      localStorage.setItem('study-sync-saved-notes', JSON.stringify(updatedNotes));
      
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    }
  };

  const summarizeNotes = async (noteContent = null) => {
    const contentToSummarize = noteContent || notes;
    console.log('Summary called with content:', contentToSummarize);
    
    if (!contentToSummarize.trim()) {
      alert('Please write some notes first!');
      return;
    }
    
    setIsAiLoading(true);
    console.log('Starting AI summary request...');
    
    try {
      const resp = await axios.post(`${SERVER}/api/ai/generate`, { 
        prompt: `Please provide a concise summary of these study notes in bullet points:\n\n${contentToSummarize}` 
      });
      
      console.log('AI response received:', resp.data);
      const summary = resp.data?.response || 'Could not generate summary';
      const provider = resp.data?.provider || 'AI';
      
      setAiResponses(prev => [...prev, {
        type: 'summary',
        content: summary,
        provider: provider.toUpperCase(),
        timestamp: Date.now(),
        id: Date.now()
      }]);
      
      // Switch to AI tab to show the summary
      setActiveTab('ai');
      console.log('Summary added to AI responses and switched to AI tab');
    } catch (err) {
      console.error('Summary error:', err);
      
      // Fallback: Create a simple text-based summary
      const sentences = contentToSummarize.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const keyPoints = sentences.slice(0, Math.min(5, sentences.length)).map((s, i) => `• ${s.trim()}`);
      const fallbackSummary = keyPoints.length > 0 ? 
        `Key Points Summary:\n${keyPoints.join('\n')}` : 
        'Summary: Your notes contain important study material. Consider organizing them into main topics and subtopics for better understanding.';
      
      setAiResponses(prev => [...prev, {
        type: 'summary',
        content: fallbackSummary,
        provider: 'LOCAL',
        timestamp: Date.now(),
        id: Date.now()
      }]);
      
      setActiveTab('ai');
      console.log('Used fallback summary due to AI error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateQuiz = async (noteContent = null) => {
    const contentToUse = noteContent || notes;
    if (!contentToUse.trim()) {
      alert('Please write some notes first!');
      return;
    }

    try {
      const resp = await axios.post(`${SERVER}/api/ai/generate`, { 
        prompt: `Create a 5-question multiple choice quiz from these notes. Format as "Q: [question]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\nCorrect: [A/B/C/D]" with each question separated by "---":\n\n${contentToUse}` 
      });
      const quizText = resp.data?.response || '';
      const questions = quizText.split('---')
        .filter(q => q.trim())
        .map((q, index) => {
          const lines = q.trim().split('\n');
          const question = lines[0]?.replace('Q: ', '') || `Question ${index + 1}`;
          const options = lines.slice(1, 5).map(line => line.substring(3)); // Remove A), B), etc.
          const correctLine = lines.find(line => line.startsWith('Correct:'));
          const correct = correctLine?.substring(9).trim() || 'A';
          
          return { question, options, correct, id: index };
        });
      
      if (questions.length === 0) {
        alert('Could not generate quiz. Please try with more detailed notes.');
        return;
      }
      
      setQuiz(questions);
      setCurrentQuizIndex(0);
      setQuizAnswers({});
      setActiveTab('quiz');
    } catch (err) {
      alert('Error generating quiz: ' + err.message);
    }
  };

  // Timer Functions
  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerMinutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const askAI = async () => {
    if (!prompt) return;
    
    setIsAiLoading(true);
    
    // Add the question to AI responses
    setAiResponses(prev => [...prev, {
      type: 'question',
      content: prompt,
      timestamp: Date.now(),
      id: Date.now()
    }]);
    
    try {
      const resp = await axios.post(`${SERVER}/api/ai/generate`, { prompt });
      const text = resp.data?.response || 'No response received';
      const provider = resp.data?.provider || 'AI';
      
      // Add the response to AI responses
      setAiResponses(prev => [...prev, {
        type: 'response',
        content: text.trim(),
        provider: provider.toUpperCase(),
        timestamp: Date.now(),
        id: Date.now() + 1
      }]);
      
      setPrompt(''); // Clear the prompt after sending
    } catch (err) {
      console.error(err);
      setAiResponses(prev => [...prev, {
        type: 'error',
        content: err?.response?.data?.error || err.message,
        timestamp: Date.now(),
        id: Date.now() + 1
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="study-room">
      {/* Study Timer Header */}
      <div className="timer-header">
        <div className="timer-display">
          <span className="timer-time">{formatTime(timeLeft)}</span>
          <div className="timer-controls">
            <button onClick={startTimer} disabled={isTimerRunning} className="timer-btn start">
              ▶️ Start
            </button>
            <button onClick={pauseTimer} disabled={!isTimerRunning} className="timer-btn pause">
              ⏸️ Pause
            </button>
            <button onClick={resetTimer} className="timer-btn reset">
              🔄 Reset
            </button>
          </div>
        </div>
        <div className="study-stats">
          <div className="stat">
            <span className="stat-value">{studyStats.sessionsCompleted}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{studyStats.totalStudyTime}m</span>
            <span className="stat-label">Study Time</span>
          </div>
          <div className="stat">
            <span className="stat-value">{studyStats.flashcardsReviewed}</span>
            <span className="stat-label">Cards Reviewed</span>
          </div>
          <button 
            onClick={() => setShowAISettings(true)}
            className="ai-settings-btn"
            title="AI Provider Settings"
          >
            ⚙️ AI Settings
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            🤖 AI Assistant
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saved-notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved-notes')}
          >
            💾 Saved Notes ({savedNotes.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            📝 Quiz ({quiz.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'ai' && (
            <div className="ai-section">
              <div className="section-header">
                <h3>🤖 AI Study Assistant</h3>
                <button 
                  onClick={() => setAiResponses([])}
                  className="tool-btn"
                  title="Clear AI History"
                >
                  🗑️ Clear
                </button>
              </div>
              
              <div className="ai-content">
                <div className="ai-responses">
                  {aiResponses.map(response => (
                    <div key={response.id} className={`ai-response ${response.type}`}>
                      {response.type === 'question' && (
                        <div className="question-bubble">
                          <div className="bubble-header">
                            <span className="bubble-icon">❓</span>
                            <span className="bubble-label">Your Question</span>
                            <span className="bubble-time">{new Date(response.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="bubble-content">{response.content}</div>
                        </div>
                      )}
                      
                      {response.type === 'response' && (
                        <div className="response-bubble">
                          <div className="bubble-header">
                            <span className="bubble-icon">🤖</span>
                            <span className="bubble-label">{response.provider} Response</span>
                            <span className="bubble-time">{new Date(response.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="bubble-content">{response.content}</div>
                        </div>
                      )}
                      
                      {response.type === 'summary' && (
                        <div className="summary-bubble">
                          <div className="bubble-header">
                            <span className="bubble-icon">📋</span>
                            <span className="bubble-label">{response.provider} Summary</span>
                            <span className="bubble-time">{new Date(response.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="bubble-content">{response.content}</div>
                        </div>
                      )}
                      
                      {response.type === 'error' && (
                        <div className="error-bubble">
                          <div className="bubble-header">
                            <span className="bubble-icon">❌</span>
                            <span className="bubble-label">Error</span>
                            <span className="bubble-time">{new Date(response.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="bubble-content">{response.content}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isAiLoading && (
                    <div className="ai-response loading">
                      <div className="response-bubble">
                        <div className="bubble-header">
                          <span className="bubble-icon">🤔</span>
                          <span className="bubble-label">AI is thinking...</span>
                        </div>
                        <div className="bubble-content">
                          <div className="loading-dots">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiResponses.length === 0 && !isAiLoading && (
                    <div className="empty-state">
                      <p>Ask me anything about your studies!</p>
                    </div>
                  )}
                </div>
                
                <div className="ai-input-area">
                  <textarea 
                    value={prompt} 
                    onChange={e=>setPrompt(e.target.value)} 
                    placeholder="Ask me anything about your studies... e.g., 'Explain the Feynman technique' or 'Help me understand photosynthesis'"
                    rows={3}
                    className="ai-textarea"
                  />
                  <button 
                    onClick={askAI} 
                    disabled={!prompt.trim() || isAiLoading}
                    className="ai-button"
                  >
                    {isAiLoading ? '🤔 Thinking...' : 
                     prompt.trim() ? '✨ Ask AI' : '💭 Type a question...'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved-notes' && (
            <div className="saved-notes-section">
              <div className="section-header">
                <h3>💾 Saved Notes</h3>
                <button onClick={() => saveCurrentNotes()} className="generate-btn">
                  💾 Save Current Notes
                </button>
              </div>
              
              {savedNotes.length > 0 ? (
                <div className="saved-notes-list">
                  {savedNotes.map(note => (
                    <div key={note.id} className="saved-note-card">
                      <div className="note-header">
                        <h4>{note.name}</h4>
                        <div className="note-actions">
                          <button 
                            onClick={() => loadSavedNote(note.id)}
                            className="action-btn load"
                            title="Load this note"
                          >
                            📂 Load
                          </button>
                          <button 
                            onClick={() => summarizeNotes(note.content)}
                            className="action-btn summarize"
                            title="Summarize this note"
                          >
                            📋 Summary
                          </button>
                          <button 
                            onClick={() => generateQuiz(note.content)}
                            className="action-btn quiz"
                            title="Create quiz from this note"
                          >
                            📝 Quiz
                          </button>
                          <button 
                            onClick={() => deleteSavedNote(note.id)}
                            className="action-btn delete"
                            title="Delete this note"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="note-meta">
                        <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                        <span>Modified: {new Date(note.lastModified).toLocaleDateString()}</span>
                      </div>
                      <div className="note-preview">
                        {note.content.substring(0, 200)}
                        {note.content.length > 200 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No saved notes yet. Save your current notes to apply AI tools later!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="quiz-section">
              <div className="section-header">
                <h3>📝 Study Quiz</h3>
                <button onClick={generateQuiz} className="generate-btn">
                  ✨ Generate from Notes
                </button>
              </div>
              
              {quiz.length > 0 ? (
                <div className="quiz-container">
                  <div className="quiz-progress">
                    Question {currentQuizIndex + 1} of {quiz.length}
                  </div>
                  
                  <div className="quiz-question">
                    <h4>{quiz[currentQuizIndex]?.question}</h4>
                    <div className="quiz-options">
                      {quiz[currentQuizIndex]?.options.map((option, idx) => (
                        <label key={idx} className="quiz-option">
                          <input
                            type="radio"
                            name={`question-${currentQuizIndex}`}
                            value={String.fromCharCode(65 + idx)}
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [currentQuizIndex]: e.target.value
                            })}
                            checked={quizAnswers[currentQuizIndex] === String.fromCharCode(65 + idx)}
                          />
                          <span>{String.fromCharCode(65 + idx)}) {option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="quiz-controls">
                    <button 
                      onClick={() => setCurrentQuizIndex(Math.max(0, currentQuizIndex - 1))}
                      disabled={currentQuizIndex === 0}
                    >
                      ⬅️ Previous
                    </button>
                    {currentQuizIndex < quiz.length - 1 ? (
                      <button 
                        onClick={() => setCurrentQuizIndex(currentQuizIndex + 1)}
                      >
                        Next ➡️
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          const score = quiz.reduce((acc, q, idx) => {
                            return acc + (quizAnswers[idx] === q.correct ? 1 : 0);
                          }, 0);
                          alert(`Quiz Complete! Your score: ${score}/${quiz.length} (${Math.round(score/quiz.length*100)}%)`);
                        }}
                        className="finish-quiz"
                      >
                        🏁 Finish Quiz
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No quiz yet. Generate one from your notes!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes Sidebar */}
      <aside className="notes-sidebar">
        <div className="section-header">
          <h3>📝 Study Notes</h3>
          <div className="notes-tools">
            <input
              type="text"
              placeholder="Enter note title (optional)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              style={{ 
                padding: '5px', 
                marginRight: '5px', 
                borderRadius: '4px', 
                border: '1px solid #ccc',
                fontSize: '12px',
                width: '150px'
              }}
            />
            <button 
              onClick={saveCurrentNotes} 
              className="tool-btn" 
              title="Save Notes"
              style={{ backgroundColor: '#4CAF50', color: 'white' }}
            >
              💾 Save Notes
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                alert('Token cleared! Please refresh the page and log in again.');
              }} 
              className="tool-btn" 
              title="Clear Token"
              style={{ backgroundColor: '#ff6b6b', color: 'white', fontSize: '10px' }}
            >
              🔄 Clear Token
            </button>
            <button onClick={() => summarizeNotes()} className="tool-btn" title="Summarize Notes">
              📋 Summary
            </button>
          </div>
        </div>
        <textarea 
          rows={15} 
          value={notes} 
          onChange={e=>updateNotes(e.target.value)} 
          placeholder="Start taking notes... They'll sync with everyone in the room! Use the 'Save' button to save notes for later AI analysis."
          className="notes-textarea"
        />
        
        {/* Saved Notes Section */}
        <div className="saved-notes-section">
          <h4>📚 My Saved Notes</h4>
          <div className="saved-notes-list">
            {authUser ? (
              savedNotes.length > 0 ? (
                savedNotes.map((note) => (
                  <div key={note._id} className="saved-note-item">
                    <div className="note-header">
                      <strong>{note.title}</strong>
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="note-preview">
                      {note.content.substring(0, 100)}
                      {note.content.length > 100 && '...'}
                    </div>
                    <div className="note-subject">Subject: {note.subject}</div>
                  </div>
                ))
              ) : (
                <p className="empty-notes">No saved notes yet. Save your current notes to see them here!</p>
              )
            ) : (
              <p className="auth-prompt">Please log in to view saved notes</p>
            )}
          </div>
        </div>
      </aside>

      {/* AI Settings Modal */}
      <AISettings 
        isOpen={showAISettings} 
        onClose={() => setShowAISettings(false)} 
      />
    </div>
  );
}


