


import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, MessageSquare, Trash2, Bot, User, Loader2, Zap, Menu, X } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/skeleton';


function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-sky"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}


function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${isUser ? 'bg-sky' : 'bg-bg-elevated border border-sky/30'}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-text-inverse" />
          : <Zap className="w-3.5 h-3.5 text-sky" />}
      </div>

      {}
      <div className={`flex flex-col gap-1 max-w-[78%] sm:max-w-[72%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-sky text-text-inverse rounded-tr-sm'
            : 'bg-bg-elevated border border-border text-text-primary rounded-tl-sm'
          }`}>
          {msg.content}
        </div>
        {}
        {msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.sources.map((s, i) => (
              <span key={i} className="text-[10px] badge-sky">{s.title}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}


function SessionsList({ sessions, activeId, onSelect, onDelete, onCreate, creating }) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onCreate}
        disabled={creating}
        className="btn-primary flex items-center gap-2 text-sm w-full justify-center mb-3"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-1">
        {sessions.map((s) => (
          <div
            key={s._id}
            onClick={() => onSelect(s._id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-btn cursor-pointer transition-colors group
              ${activeId === s._id ? 'bg-sky-muted border-l-2 border-sky text-sky' : 'hover:bg-bg-elevated text-text-secondary'}`}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs flex-1 truncate">{s.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s._id); }}
              className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error transition-opacity flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-text-tertiary text-xs py-8">No chats yet</p>
        )}
      </div>
    </div>
  );
}


const QUICK_PROMPTS = [
  'What documents do I have?',
  'Find any low confidence documents',
  'Summarize my documents',
  'Which documents have PII?',
];

export default function Chat() {

  const { id: documentIdFromUrl } = useParams();

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const qc = useQueryClient();


  const { data: sessionsData } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: chatAPI.getSessions,
    staleTime: Infinity,
  });


  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['chatSession', activeSessionId],
    queryFn: () => chatAPI.getSession(activeSessionId),
    enabled: !!activeSessionId,
    staleTime: 60000,
  });

  const sessions = sessionsData?.data?.sessions || [];


  useEffect(() => {
    if (documentIdFromUrl && !activeSessionId && !createSession.isPending) {

      const existingSession = sessions.find(
        s => s.documentId && String(s.documentId._id || s.documentId) === documentIdFromUrl
      );
      if (existingSession) {
        setActiveSessionId(existingSession._id);
      } else if (sessions.length >= 0 && sessionsData) {

        createSession.mutate();
      }
    }

  }, [documentIdFromUrl, sessionsData]);
  const currentSession = sessionData?.data?.session;


  const createSession = useMutation({
    mutationFn: () => chatAPI.createSession({ isGlobal: !documentIdFromUrl, documentId: documentIdFromUrl || null }),
    onSuccess: (res) => {
      setActiveSessionId(res.data.session._id);
      setShowMobileSidebar(false);
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
    },
    onError: () => toast.error('Could not create chat'),
  });


  const deleteSession = useMutation({
    mutationFn: chatAPI.deleteSession,
    onSuccess: (_, deletedId) => {
      if (activeSessionId === deletedId) setActiveSessionId(null);
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
    },
  });


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isTyping]);


  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !activeSessionId || isTyping) return;

    setMessage('');
    setIsTyping(true);


    qc.setQueryData(['chatSession', activeSessionId], (old) => {
      if (!old?.data?.session) return old;
      return {
        ...old,
        data: {
          ...old.data,
          session: {
            ...old.data.session,
            messages: [
              ...(old.data.session.messages || []),
              { _id: 'temp-' + Date.now(), role: 'user', content: text },
            ],
          },
        },
      };
    });

    try {
      await chatAPI.sendMessage(activeSessionId, text);

      qc.invalidateQueries({ queryKey: ['chatSession', activeSessionId] });
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
    } catch {
      toast.error('Failed to send message. Check your Gemini API key.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-7rem)] flex gap-0 md:gap-4 max-w-6xl mx-auto relative">

      {}
      <div className="hidden md:flex w-60 flex-shrink-0 flex-col gap-2">
        <SessionsList
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={setActiveSessionId}
          onDelete={(id) => deleteSession.mutate(id)}
          onCreate={() => createSession.mutate()}
          creating={createSession.isPending}
        />
      </div>

      {}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            {}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-bg-secondary border-r border-border z-50 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-text-primary">Chats</span>
                <button onClick={() => setShowMobileSidebar(false)} className="text-text-tertiary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <SessionsList
                  sessions={sessions}
                  activeId={activeSessionId}
                  onSelect={(id) => { setActiveSessionId(id); setShowMobileSidebar(false); }}
                  onDelete={(id) => deleteSession.mutate(id)}
                  onCreate={() => createSession.mutate()}
                  creating={createSession.isPending}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {}
      <div className="flex-1 card flex flex-col overflow-hidden min-w-0">

        {}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          {}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden text-text-secondary hover:text-text-primary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-full bg-sky-muted border border-sky/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-sky" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {currentSession?.title || 'DocuRec AI'}
            </p>
            <p className="text-[10px] text-text-tertiary">Powered by Gemini</p>
          </div>
        </div>

        {activeSessionId ? (
          <>
            {}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {sessionLoading ? (

                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {}
                  {(!currentSession?.messages || currentSession.messages.length === 0) && (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-14 h-14 rounded-full bg-sky-muted border border-sky/20 flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-7 h-7 text-sky" />
                      </div>
                      <p className="text-text-primary font-medium mb-1">DocuRec AI</p>
                      <p className="text-text-tertiary text-sm mb-6">Ask anything about your documents</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
                        {QUICK_PROMPTS.map((p) => (
                          <button
                            key={p}
                            onClick={() => setMessage(p)}
                            className="text-xs text-left px-3 py-2 bg-bg-elevated border border-border rounded-lg hover:border-sky text-text-secondary hover:text-text-primary transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {}
                  {currentSession?.messages?.map((msg, i) => (
                    <Message key={msg._id || i} msg={msg} />
                  ))}

                  {}
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-bg-elevated border border-sky/30 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-sky" />
                      </div>
                      <div className="px-4 py-3 bg-bg-elevated border border-border rounded-2xl rounded-tl-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {}
            <div className="border-t border-border p-3 sm:p-4 flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your documents… (Enter to send)"
                  rows={1}
                  className="input flex-1 resize-none text-sm py-2.5 min-h-[42px] max-h-28"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isTyping}
                  className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1.5 hidden sm:block">
                Press Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (

          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6 sm:p-8">
            <div className="w-16 h-16 rounded-full bg-sky-muted border border-sky/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-sky" />
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">No chat selected</p>
              <p className="text-text-tertiary text-sm">Create a new chat to start asking questions</p>
            </div>
            <button onClick={() => createSession.mutate()} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Chat
            </button>
            {}
            <p className="text-text-tertiary text-xs md:hidden">
              Tap the <Menu className="w-3 h-3 inline" /> menu to see previous chats
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
