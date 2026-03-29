import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Send, Loader2, RefreshCw, MoreHorizontal, Star, ArrowUp, MessageSquare, Wand2, Flame, Heart, History, X, Clock, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { DiagnosticsPanel, SourceIndicator } from '@/components/DiagnosticsPanel';
import { useUserList } from '@/hooks/useAnimeData';
import * as animeData from '@/lib/animeData';
import { enrichAnimeData } from '@/lib/anime-utils';
import { AnimeCardData, SearchFilters } from '@/types/anime';
import { toast } from '@/hooks/use-toast';
import { cn, proxyImage, handleImageError } from '@/lib/utils';
import { localAISearch } from '@/lib/aiSearch';

interface SearchSpec {
  query?: string;
  genres?: string[];
  excludeGenres?: string[];
  yearMin?: number;
  yearMax?: number;
  scoreMin?: number;
  status?: string;
  format?: string;
  sort?: string;
  episodesMax?: number;
  specificTitles?: string[];
  similarTo?: string;
  similarityReason?: string;
}

interface AIResponse {
  interpretation: string;
  searchSpec: SearchSpec;
  vibeDescription: string;
  suggestions: string[];
  reasoning?: string;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  searchSpec?: SearchSpec;
  animes?: AnimeCardData[];
  interpretation?: string;
  vibeDescription?: string;
  suggestions?: string[];
  isLoading?: boolean;
  source?: 'anilist' | 'jikan';
  similarityReason?: string;
}

// Chat history types
interface ChatHistoryEntry {
  id: string;
  firstMessage: string;
  timestamp: number;
  resultCount: number;
  messages: Message[];
}

const SUGGESTION_PROMPTS = [
  { icon: Flame, label: 'Fantasy adventure dengan MC OP' },
  { icon: Heart, label: 'Romance yang healing dan cozy' },
  { icon: Wand2, label: 'Psychological thriller mind-bending' },
  { icon: MessageSquare, label: 'Anime pendek bisa ditamatin weekend' },
];

// localStorage helpers
const HISTORY_KEY = 'ainime-chat-history';

function loadHistory(): ChatHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: ChatHistoryEntry[]) {
  try {
    // Keep last 50 entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    // localStorage full or unavailable
  }
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AISearch() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>(loadHistory);
  const [currentSessionId] = useState(() => Date.now().toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addToList } = useUserList();

  // Get the latest results from messages
  const latestResults = messages
    .filter(m => m.role === 'assistant' && m.animes && m.animes.length > 0)
    .slice(-1)
    .flatMap(m => m.animes || []);

  const hasMessages = messages.length > 0;
  const hasResults = latestResults.length > 0;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial query from URL
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery);
    }
  }, []);

  // Save to history when messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find(m => m.role === 'user');
    if (!firstUserMsg) return;

    const totalResults = messages
      .filter(m => m.role === 'assistant' && m.animes)
      .reduce((sum, m) => sum + (m.animes?.length || 0), 0);

    const entry: ChatHistoryEntry = {
      id: currentSessionId,
      firstMessage: firstUserMsg.content,
      timestamp: Date.now(),
      resultCount: totalResults,
      messages: messages.filter(m => !m.isLoading),
    };

    setChatHistory(prev => {
      const updated = [entry, ...prev.filter(e => e.id !== currentSessionId)];
      saveHistory(updated);
      return updated;
    });
  }, [messages, currentSessionId]);

  const convertSearchSpecToFilters = (spec: SearchSpec): SearchFilters => {
    const filters: SearchFilters = {
      excludeNsfw: true,
    };

    if (spec.query) filters.query = spec.query;
    if (spec.genres?.length) filters.genres = spec.genres;
    if (spec.excludeGenres?.length) filters.excludeGenres = spec.excludeGenres;
    if (spec.yearMin) filters.yearMin = spec.yearMin;
    if (spec.yearMax) filters.yearMax = spec.yearMax;
    if (spec.scoreMin) filters.scoreMin = spec.scoreMin;
    if (spec.status) filters.status = [spec.status];
    if (spec.format) filters.format = [spec.format];

    if (spec.sort) {
      const sortMap: Record<string, SearchFilters['sort']> = {
        'SCORE_DESC': 'SCORE_DESC',
        'POPULARITY_DESC': 'POPULARITY_DESC',
        'TRENDING_DESC': 'TRENDING_DESC',
      };
      filters.sort = sortMap[spec.sort] || 'SCORE_DESC';
    }

    if (spec.episodesMax) {
      filters.episodesMax = spec.episodesMax;
    }

    return filters;
  };

  const handleSend = async (query?: string, seedAnime?: AnimeCardData) => {
    const message = query || input.trim();
    if (!message && !seedAnime) return;

    setInput('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: seedAnime ? `Cari anime mirip ${seedAnime.title.english || seedAnime.title.romaji}: ${message || 'similar vibes'}` : message,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading assistant message
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      role: 'assistant',
      content: '',
      isLoading: true,
    }]);

    try {
      // Build chat history for context
      const chatHistoryCtx = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'assistant' && m.searchSpec
          ? JSON.stringify({ interpretation: m.interpretation, searchSpec: m.searchSpec })
          : m.content,
      }));

      // Call local AI search
      const aiResponse = await localAISearch(
        message,
        chatHistoryCtx,
        seedAnime ? {
          title: seedAnime.title.english || seedAnime.title.romaji,
          genres: seedAnime.genres,
          tags: seedAnime.tags?.map(t => t.name),
        } : undefined,
      ) as AIResponse;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      let animes: AnimeCardData[] = [];
      let searchSource: 'anilist' | 'jikan' = 'anilist';

      // First: Search for specificTitles if LLM recommended any
      if (aiResponse.searchSpec.specificTitles?.length) {

        const specificSearchPromises = aiResponse.searchSpec.specificTitles.map(async (title: string) => {
          try {
            const result = await animeData.searchAnime({
              query: title,
              excludeNsfw: true
            });
            searchSource = result.source;
            return result.data.slice(0, 1);
          } catch (err) {
            console.warn(`Failed to search for "${title}":`, err);
            return [];
          }
        });

        const specificResults = await Promise.all(specificSearchPromises);
        animes = specificResults.flat().map(enrichAnimeData);
      }

      // Second: Add filter-based results for broader search
      const filters = convertSearchSpecToFilters(aiResponse.searchSpec);
      if (filters.genres?.length || filters.query) {
        const searchResult = await animeData.searchAnime(filters);
        searchSource = searchResult.source;

        let filterAnimes = searchResult.data.map(enrichAnimeData);

        if (aiResponse.searchSpec.episodesMax) {
          filterAnimes = filterAnimes.filter(a => !a.episodes || a.episodes <= aiResponse.searchSpec.episodesMax!);
        }

        animes = [...animes, ...filterAnimes];
      }

      // Deduplicate by ID
      const seen = new Set<number>();
      animes = animes.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      }).slice(0, 12);

      // Update the loading message with results
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? {
            ...msg,
            isLoading: false,
            content: aiResponse.interpretation,
            interpretation: aiResponse.interpretation,
            searchSpec: aiResponse.searchSpec,
            vibeDescription: aiResponse.vibeDescription,
            suggestions: aiResponse.suggestions,
            similarityReason: aiResponse.searchSpec.similarityReason,
            animes,
            source: searchSource,
          }
          : msg
      ));

    } catch (error) {
      console.error('AI Search error:', error);

      if (seedAnime && seedAnime.genres?.length) {
        try {
          const similarFilters = {
            genres: seedAnime.genres.slice(0, 3),
            excludeNsfw: true,
            sort: 'SCORE_DESC' as const
          };

          const similarResult = await animeData.searchAnime(similarFilters);
          let animes = similarResult.data.slice(0, 12).map(enrichAnimeData);
          animes = animes.filter(a => a.id !== seedAnime.id);

          setMessages(prev => prev.map(msg =>
            msg.id === loadingMessageId
              ? {
                ...msg,
                isLoading: false,
                content: `Mencari anime yang mirip dengan "${seedAnime.title.english || seedAnime.title.romaji}" berdasarkan genre.`,
                interpretation: `Anime serupa berdasarkan genre: ${seedAnime.genres?.slice(0, 3).join(', ')}`,
                animes,
                source: similarResult.source,
                similarityReason: `Anime dengan genre serupa: ${seedAnime.genres?.slice(0, 3).join(', ')}`,
                suggestions: ['yang lebih pendek', 'yang lebih baru', 'yang sudah tamat'],
                vibeDescription: 'Similar vibes',
              }
              : msg
          ));
          return;
        } catch (similarError) {
          console.error('Similar anime search failed:', similarError);
        }
      }

      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? {
            ...msg,
            isLoading: false,
            content: `Maaf, terjadi kesalahan saat mencari. Silakan coba lagi atau gunakan kata kunci yang berbeda.`,
            interpretation: `Pencarian: ${message}`,
          }
          : msg
      ));

      if (!seedAnime && error instanceof Error && !error.message.includes('rate limit')) {
        toast({
          title: "AI Search Error",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = (refinement: string) => {
    handleSend(refinement);
  };

  const handleMoreLikeThis = (anime: AnimeCardData) => {
    handleSend('', anime);
  };

  const handleSave = (anime: AnimeCardData) => {
    addToList(anime, 'SAVED');
    toast({ title: "Saved!", description: `${anime.title.english || anime.title.romaji} added to your list.` });
  };

  const handleLove = (anime: AnimeCardData) => {
    addToList(anime, 'LOVED');
    toast({ title: "Loved!", description: `${anime.title.english || anime.title.romaji} is in your favorites.` });
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
  };

  const loadConversation = (entry: ChatHistoryEntry) => {
    setMessages(entry.messages);
    setShowHistory(false);
  };

  const deleteHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="min-h-screen bg-[#0c1324]">
      <Header />
      <SourceIndicator />

      <main className="pt-24 pb-20 px-6 md:px-[3.5rem] max-w-[1600px] mx-auto w-full">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* ===== LEFT COLUMN (7/12): CONVERSATION AREA ===== */}
          <div className="lg:col-span-7 flex flex-col min-h-[calc(100vh-8rem)]">
            {/* Header with history button */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] text-[#dce1fb]">
                  Describe what you <span className="italic font-light text-[#f97316]">want</span> to watch
                </h1>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 flex-shrink-0 ml-4 mt-2",
                    showHistory
                      ? "bg-[#f97316] text-[#582200]"
                      : "bg-[#23293c] text-slate-400 hover:text-[#dce1fb] hover:bg-[#2e3447]"
                  )}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden md:inline">History</span>
                  <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[0.6rem]">
                    {chatHistory.length}
                  </span>
                </button>
              )}
            </div>

            {/* History Panel (dropdown) */}
            {showHistory && (
              <div className="mb-8 rounded-2xl overflow-hidden" style={{
                background: 'rgba(21, 27, 45, 0.8)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#f97316]" />
                    <span className="text-sm font-bold text-[#dce1fb]">Chat History</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {chatHistory.length > 0 && (
                      <button
                        onClick={clearAllHistory}
                        className="text-[0.65rem] tracking-[0.15em] font-bold uppercase text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowHistory(false)}
                      className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-[#dce1fb] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {chatHistory.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => loadConversation(entry)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors text-left group"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#f97316]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#dce1fb] truncate">
                          {entry.firstMessage}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[0.6rem] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.resultCount > 0 && (
                            <span className="text-[0.6rem] text-[#f97316]/60 font-bold">
                              {entry.resultCount} results
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryEntry(entry.id, e)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation thread */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!hasMessages ? (
                /* Empty state: suggestion pills above the input */
                <div className="flex flex-col justify-end h-full pb-4">
                  <div className="flex flex-wrap gap-2.5 mb-6">
                    {SUGGESTION_PROMPTS.map((prompt) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={prompt.label}
                          onClick={() => handleSend(prompt.label)}
                          className="flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 bg-[#23293c]/60 text-[#dce1fb]/60 hover:bg-[#d0bcff]/15 hover:text-[#dce1fb]"
                          style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0 opacity-50" />
                          <span>{prompt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Messages thread */
                <div className="space-y-8 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="animate-slide-up">
                      {message.role === 'user' ? (
                        /* User message - right-aligned pill */
                        <div className="flex justify-end">
                          <div className="max-w-[85%]">
                            <div className="bg-[#f97316]/10 text-[#f97316] px-5 py-3 rounded-2xl rounded-tr-sm font-medium text-base">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Assistant message - left-aligned */
                        <div className="max-w-full">
                          {message.isLoading ? (
                            <div className="flex items-center gap-3 py-4 text-slate-400">
                              <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
                              <span className="text-sm">Curating recommendations...</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Vibe chip */}
                              {message.vibeDescription && (
                                <span className="inline-block px-3 py-1 rounded-full text-[0.6rem] font-bold tracking-[0.15em] uppercase bg-[#d0bcff]/10 text-[#d0bcff]">
                                  {message.vibeDescription}
                                </span>
                              )}

                              {/* AI response text - clean, left-aligned with accent border */}
                              <div className="text-base leading-[1.8] text-[#dce1fb]/85 pl-4" style={{ borderLeft: '2px solid rgba(249, 115, 22, 0.3)' }}>
                                {message.content}
                              </div>

                              {/* Similarity reason */}
                              {message.similarityReason && (
                                <div className="pl-4 text-sm text-[#e0c0b1]/60 italic">
                                  <span className="text-[#f97316]/60 font-medium">Why similar: </span>
                                  {message.similarityReason}
                                </div>
                              )}

                              {/* Refinement chips after AI response */}
                              {message.animes && message.animes.length > 0 && (
                                <div className="pt-2 space-y-3">
                                  {/* Refine chips */}
                                  <div className="flex flex-wrap gap-2">
                                    <span className="text-[0.6rem] tracking-[0.15em] font-bold uppercase text-slate-600 mr-1 self-center">Refine</span>
                                    {[
                                      { id: 'modern', label: '2020+', query: 'yang rilis 2020 ke atas' },
                                      { id: 'short', label: 'Pendek', query: 'yang lebih pendek (max 13 eps)' },
                                      { id: 'finished', label: 'Tamat', query: 'yang sudah selesai tayang' },
                                      { id: 'no-romance', label: 'No Romance', query: 'tanpa romance' },
                                      { id: 'cozy', label: 'Cozy', query: 'yang lebih cozy dan healing' },
                                    ].map((chip) => (
                                      <button
                                        key={chip.id}
                                        onClick={() => handleRefine(chip.query)}
                                        className="px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide bg-[#23293c] text-slate-400 hover:bg-[#d0bcff] hover:text-[#0c1324] transition-all duration-300"
                                      >
                                        {chip.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* More like this */}
                                  <div>
                                    <span className="text-[0.6rem] tracking-[0.15em] font-bold uppercase text-slate-600 block mb-2">More like</span>
                                    <div className="flex flex-wrap gap-2">
                                      {message.animes.slice(0, 3).map((anime) => (
                                        <button
                                          key={anime.id}
                                          onClick={() => handleMoreLikeThis(anime)}
                                          className="text-[0.65rem] text-slate-400 hover:text-[#f97316] transition-colors flex items-center gap-1.5 font-medium"
                                        >
                                          <MoreHorizontal className="w-3 h-3" />
                                          {(anime.title.english || anime.title.romaji).slice(0, 25)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Suggestion chips from AI */}
                              {message.suggestions && message.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {message.suggestions.map((suggestion, sidx) => (
                                    <button
                                      key={sidx}
                                      onClick={() => handleRefine(suggestion)}
                                      className="px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide bg-[#23293c] text-slate-400 hover:bg-[#d0bcff] hover:text-[#0c1324] transition-all duration-300"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {message.animes && message.animes.length === 0 && (
                                <div className="text-slate-500 text-sm py-3 pl-4">
                                  Tidak ada hasil ditemukan. Coba dengan deskripsi yang berbeda.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New conversation button after messages */}
                  {messages.length > 0 && !isLoading && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={clearChat}
                        className="text-[0.65rem] tracking-[0.15em] font-bold uppercase text-slate-500 hover:text-[#dce1fb] transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        New Conversation
                      </button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat input - at the bottom of the conversation column, inline */}
            <div className="pt-4 pb-2 mt-auto">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={hasMessages ? "Refine your search..." : "Describe what you want to watch..."}
                    className="w-full bg-transparent border-0 border-b border-[#584237]/30 py-3 px-0 focus:ring-0 focus:border-[#f97316] transition-all placeholder:text-slate-600 text-base font-medium text-[#dce1fb] outline-none"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0",
                    input.trim() && !isLoading
                      ? "bg-[#f97316] text-[#582200] hover:scale-110 active:scale-95"
                      : "bg-[#23293c] text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ===== RIGHT COLUMN (5/12): CURATED RESULTS SIDEBAR ===== */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                <span className="text-[0.65rem] tracking-[0.2em] font-black uppercase text-slate-500">Curated Results</span>
              </div>
              {hasResults && (
                <span className="text-[#f97316] text-xs font-bold italic">
                  {latestResults.length} matches
                </span>
              )}
            </div>

            {hasResults ? (
              <div className="space-y-4 pr-1">
                {latestResults.map((anime, idx) => {
                  const title = anime.title.english || anime.title.romaji;
                  const studio = anime.studios?.edges?.[0]?.node?.name || anime.studios?.nodes?.[0]?.name || '';
                  return (
                    <Link
                      key={anime.id}
                      to={`/anime/${anime.id}`}
                      className="group block rounded-xl overflow-hidden transition-all duration-500 hover:translate-y-[-2px]"
                      style={{
                        background: 'rgba(21, 27, 45, 0.5)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        animationDelay: `${idx * 80}ms`,
                        animation: 'fadeSlideIn 0.4s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      <div className="flex gap-4 p-3">
                        {/* Cover image */}
                        <div className="relative w-24 flex-shrink-0 aspect-[3/4] rounded-lg overflow-hidden">
                          <img
                            src={proxyImage(anime.coverImage.large)}
                            alt={title}
                            className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                            onError={handleImageError}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324]/60 via-transparent to-transparent" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#dce1fb] line-clamp-2 mb-1.5 group-hover:text-[#f97316] transition-colors">
                              {title}
                            </h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest line-clamp-1 mb-2">
                              {anime.genres?.slice(0, 3).join(' / ')}
                            </p>
                            {studio && (
                              <p className="text-[10px] text-slate-600 tracking-wide">
                                {studio}
                              </p>
                            )}
                          </div>

                          {/* Score badge */}
                          {anime.averageScore && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-3 h-3 fill-[#f97316] text-[#f97316]" />
                              <span className="text-xs font-bold text-[#f97316]">{anime.averageScore}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Empty state placeholder */
              <div className="rounded-2xl p-10 text-center space-y-4 h-[400px] flex flex-col items-center justify-center" style={{
                background: 'rgba(21, 27, 45, 0.3)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div className="w-16 h-16 rounded-2xl bg-[#23293c] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#f97316]" />
                </div>
                <p className="text-sm text-slate-500 max-w-[220px] leading-relaxed">
                  Results will appear here as the curator finds matches for you.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      <DiagnosticsPanel />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
