import React, { useEffect, useState, useRef } from 'react';
import { aiService, notesService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain, Send, Mic, MicOff, Volume2, Plus, Trash2,
  Copy, Check, AlertCircle, Sparkles, MessageSquare, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AITutor() {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [aiError, setAiError] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadConversations();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
        toast('Listening... Speak now', { icon: '🎙️' });
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported on this browser');
    }
  };

  const loadConversations = async () => {
    try {
      const res = await aiService.getConversations({ type: 'tutor' });
      setConversations(res.data.conversations || []);
    } catch {}
  };

  const selectConversation = async (convId) => {
    try {
      setCurrentConvId(convId);
      const res = await aiService.getConversation(convId);
      setMessages(res.data.conversation.messages || []);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const handleNewConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
    setAiError(null);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (currentConvId === convId) handleNewConversation();
      toast.success('Conversation cleared');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setAiError(null);

    try {
      const res = await aiService.chat({
        message: userMessage,
        conversationId: currentConvId,
        language,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response }]);
      if (!currentConvId && res.data.conversationId) {
        setCurrentConvId(res.data.conversationId);
        loadConversations();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'AI service unavailable';
      setAiError(errMsg);
      if (err.response?.data?.code === 'AI_NOT_CONFIGURED') {
        toast.error('Gemini API key is not configured in backend');
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const saveToNotes = async (content, idx) => {
    try {
      // Find the prompt question that preceded this answer
      const userMsg = messages[idx - 1]?.content || 'AI Tutor Note';
      const title = userMsg.length > 50 ? `${userMsg.substring(0, 47)}...` : userMsg;
      await notesService.createNote({
        title,
        content,
        source: 'ai_tutor',
        tags: ['AI Tutor', 'Revision'],
        conversationId: currentConvId || undefined,
      });
      toast.success('Saved to Notes!');
    } catch {
      toast.error('Failed to save to Notes');
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
      {/* Sidebar: Conversation History */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950/40">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleNewConversation}
            className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Learning Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1">Recent Chats</p>
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <div
                key={c._id}
                onClick={() => selectConversation(c._id)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  currentConvId === c._id
                    ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{c.title || 'Conversation'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, c._id)}
                  className="p-1 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">No previous conversations</p>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
        {/* Top Controls */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">EduNexa AI Tutor</h3>
              <p className="text-[11px] text-emerald-500 font-medium">● Powered by Google Gemini</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Language:</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            >
              {language === 'en' ? 'English' : 'हिंदी (Hindi)'}
            </button>
          </div>
        </div>

        {/* Configuration Notice if API Key not set */}
        {aiError && (
          <div className="m-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{aiError}</p>
              <p className="mt-0.5 text-gray-600 dark:text-gray-400">
                Please make sure <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> is configured in backend environment variables.
              </p>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                <Brain className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  How can I help you learn today?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ask me to explain any engineering concept, debug code, or break down difficult university theorems in simple words.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                {[
                  'Explain Dijkstra Algorithm with step-by-step example',
                  'What is the difference between TCP and UDP?',
                  'Explain Normalization in DBMS with 1NF, 2NF, 3NF',
                  'ऑपरेटिंग सिस्टम में डेडलॉक क्या होता है?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                    }}
                    className="p-2.5 text-left text-xs bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-100 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm relative group ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="prose dark:prose-invert max-w-none text-sm break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>

                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 text-gray-400">
                      <button
                        onClick={() => copyToClipboard(m.content, idx)}
                        className="hover:text-primary-600 p-1 rounded"
                        title="Copy answer"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => speakText(m.content)}
                        className="hover:text-primary-600 p-1 rounded"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => saveToNotes(m.content, idx)}
                        className="hover:text-primary-600 p-1 rounded flex items-center gap-1 text-xs"
                        title="Save to Notes"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Save</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeech}
            className={`p-2.5 rounded-xl border transition-colors ${
              isListening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'अपना प्रश्न यहां पूछें (जैसे: रिकर्शन क्या है?)...'
                : 'Ask anything about your syllabus, homework, or coding doubts...'
            }
            className="input text-sm flex-1"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 rounded-xl flex-shrink-0 shadow-md shadow-primary-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

