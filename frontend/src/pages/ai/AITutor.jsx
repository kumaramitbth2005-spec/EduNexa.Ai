import React, { useEffect, useState, useRef } from 'react';
import { aiService, notesService } from '../../services';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain, Send, Mic, MicOff, Volume2, Plus, Trash2,
  Copy, Check, AlertCircle, Sparkles, MessageSquare, Bookmark,
  RotateCcw, ArrowRight, Clock, ShieldAlert, Cpu
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
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [lastResponseIncomplete, setLastResponseIncomplete] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSubmittingRef = useRef(false);

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
      setAiError(null);
      setLastFailedMessage(null);
      setLastResponseIncomplete(false);
    } catch {
      toast.error('Failed to load conversation');
    }
  };

  const handleNewConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
    setAiError(null);
    setLastFailedMessage(null);
    setLastResponseIncomplete(false);
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

  const handleSend = async (e, messageOverride = null, isContinuation = false) => {
    e?.preventDefault();
    if (loading || isSubmittingRef.current) return;

    const userMessage = (messageOverride || input).trim();
    if (!userMessage && !isContinuation) return;

    // Prevent duplicate quick-clicking
    isSubmittingRef.current = true;
    setLoading(true);
    setAiError(null);
    setLastFailedMessage(null);

    // Save previous input in case of failure
    const savedInput = input;
    if (!messageOverride && !isContinuation) {
      setInput('');
    }

    if (!isContinuation) {
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    }

    try {
      const res = await aiService.chat({
        message: isContinuation ? '' : userMessage,
        conversationId: currentConvId,
        language,
        continuePrevious: isContinuation,
      });

      if (isContinuation) {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
            updated[updated.length - 1].content += `\n\n${res.data.response}`;
          }
          return updated;
        });
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response }]);
      }

      setLastResponseIncomplete(!!res.data.isIncomplete);

      if (!currentConvId && res.data.conversationId) {
        setCurrentConvId(res.data.conversationId);
        loadConversations();
      }
    } catch (err) {
      console.error('AI Tutor request failed:', err);

      // Restore user message to input box if it wasn't a continuation
      if (!isContinuation) {
        setInput(savedInput || userMessage);
        setLastFailedMessage(userMessage);
      }

      const status = err.response?.status;
      const code = err.response?.data?.code;
      let errMsg = err.response?.data?.message;

      if (code === 'AI_NOT_CONFIGURED' || status === 503) {
        errMsg = 'Google Gemini AI is not configured on the backend. Please verify GEMINI_API_KEY.';
      } else if (code === 'AI_RATE_LIMITED' || status === 429) {
        errMsg = 'The AI service is experiencing heavy traffic or daily rate limit. Please wait 30 seconds and retry.';
      } else if (code === 'AI_TIMEOUT' || status === 504 || err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'This advanced academic question took longer than 90 seconds to process. Please retry or ask to break it into sub-steps.';
      } else if (!errMsg) {
        errMsg = 'The AI Tutor encountered a network or server issue. Please click retry below.';
      }

      setAiError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
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
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
      {/* Sidebar: Conversation History */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/60 dark:bg-gray-950/40">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleNewConversation}
            className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm font-semibold"
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
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  currentConvId === c._id
                    ? 'bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{c.title || 'Academic Discussion'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, c._id)}
                  className="p-1 hover:text-red-500 rounded transition-colors"
                  title="Delete chat"
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
        {/* Top Header */}
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">EduNexa AI Tutor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  Beginner → Advanced
                </span>
              </div>
              <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active (Gemini 3.5 Flash)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Language:</span>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-primary-400 transition-colors"
            >
              {language === 'en' ? 'English' : 'हिंदी (Hindi)'}
            </button>
          </div>
        </div>

        {/* Global Error Notice if active */}
        {aiError && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{aiError}</p>
                <p className="mt-0.5 text-gray-600 dark:text-gray-400">
                  Your question has been preserved. You can click retry below or modify your question.
                </p>
              </div>
            </div>
            {lastFailedMessage && (
              <button
                onClick={() => handleSend(null, lastFailedMessage)}
                className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 flex-shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                <Brain className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  What would you like to master today?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Ask simple definitions, intermediate architecture comparisons, or deep advanced problems with code, dry runs, matrices, and complexity proofs.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full pt-2">
                {[
                  { title: 'Simple Question', text: 'What is Java?' },
                  { title: 'Intermediate OOP', text: 'Explain the difference between abstraction and encapsulation in Java with practical examples.' },
                  { title: 'Advanced DSA', text: 'Explain Dijkstra algorithm, dry run with a weighted graph, and analyze time complexity.' },
                  { title: 'Advanced OS', text: 'Explain Banker\'s Algorithm for deadlock avoidance with a numerical example.' },
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt.text);
                    }}
                    className="p-3 text-left bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-gray-100 dark:border-gray-800 rounded-xl transition-all group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block mb-1">
                      {prompt.title}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 block line-clamp-2">
                      "{prompt.text}"
                    </span>
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm relative group shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="prose dark:prose-invert max-w-none text-sm break-words leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>

                  {m.role === 'assistant' && (
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 text-gray-400">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(m.content, idx)}
                          className="hover:text-primary-600 p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Copy answer"
                        >
                          {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => speakText(m.content)}
                          className="hover:text-primary-600 p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => saveToNotes(m.content, idx)}
                          className="hover:text-primary-600 p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-1 text-xs"
                          title="Save to Notes"
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="text-xs font-medium">Save to Notes</span>
                        </button>
                      </div>

                      {/* Continuation button if this is the last assistant response and was truncated */}
                      {idx === messages.length - 1 && lastResponseIncomplete && (
                        <button
                          onClick={() => handleSend(null, '', true)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-800 hover:bg-primary-100 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Continue Generating
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Brain className="w-4 h-4" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  EduNexa AI Tutor is formulating your in-depth academic answer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => handleSend(e)} className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 bg-white dark:bg-gray-900">
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
                ? 'अपना प्रश्न यहां पूछें (जैसे: डिक्सट्रा एल्गोरिदम कैसे काम करता है?)...'
                : 'Ask any simple, intermediate, or advanced academic question...'
            }
            className="input text-sm flex-1"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary p-2.5 rounded-xl flex-shrink-0 shadow-md shadow-primary-500/20 disabled:opacity-50"
            title="Send Question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
