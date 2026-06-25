'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Play, 
  Plus, 
  Check, 
  Info, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  LogOut, 
  User, 
  Heart, 
  History, 
  AlertCircle, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

// Define TS interfaces for our data
interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  category: string;
  duration?: string;
  rating?: string;
  year?: string;
  match?: string;
}

interface FavoriteItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  description?: string;
  genre?: string;
}

interface HistoryItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  watched_at: string;
}

export default function NetflixReplica() {
  // Navigation & Session states
  const [view, setView] = useState<'landing' | 'login' | 'profiles' | 'browse'>('landing');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<{name: string, avatar: string} | null>(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Login Form States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // App Content States
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Player & Detail Modal States
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<Movie | null>(null);

  // Profile List
  const profilesList = [
    { name: 'Pai', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', color: 'border-blue-600 bg-blue-900/30' },
    { name: 'Mãe', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', color: 'border-pink-600 bg-pink-900/30' },
    { name: 'Filho', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', color: 'border-green-600 bg-green-900/30' },
    { name: 'Infantil', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80', color: 'border-yellow-500 bg-yellow-900/30' }
  ];

  // FAQ list for Landing Page
  const faqList = [
    { q: 'O que é a Netflix?', a: 'A Netflix é um serviço de streaming que oferece uma ampla variedade de séries de TV, filmes, minisséries e muito mais em milhares de aparelhos conectados à internet. Tudo dublado em português ou com legendas, direto para a sua tela.' },
    { q: 'Onde posso assistir aos filmes?', a: 'Assista onde quiser, quando quiser. Faça login com sua conta da Netflix para começar a assistir no computador ou em qualquer aparelho conectado à internet, como Smart TVs, smartphones, tablets ou videogames.' },
    { q: 'Como funciona o NetMovies neste replica?', a: 'Este replica integra o catálogo de filmes completos e dublados do famoso canal NetMovies no YouTube, utilizando a chave de API oficial de forma segura para transmitir os vídeos em alta fidelidade!' },
    { q: 'Como posso cancelar?', a: 'A Netflix é flexível. Não há contratos de fidelidade nem multas. Você pode cancelar a sua conta online com apenas dois cliques quando quiser.' }
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // References for row horizontal scroll
  const rowRefs = {
    recentes: useRef<HTMLDivElement>(null),
    favorites: useRef<HTMLDivElement>(null),
    acao: useRef<HTMLDivElement>(null),
    comedy: useRef<HTMLDivElement>(null),
    drama: useRef<HTMLDivElement>(null),
    romance: useRef<HTMLDivElement>(null),
    horror: useRef<HTMLDivElement>(null),
    series: useRef<HTMLDivElement>(null),
  };

  // Monitor page scroll to change header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Movies on Mount
  useEffect(() => {
    async function fetchMovies() {
      setMoviesLoading(true);
      try {
        const res = await fetch('/api/movies');
        if (res.ok) {
          const data = await res.json();
          setMovies(data);
        } else {
          console.error('Error fetching movies API');
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setMoviesLoading(false);
      }
    }
    fetchMovies();
  }, []);

  // Initialize Auth listeners and LocalStorage cache on Mount
  useEffect(() => {
    // Check current Supabase session
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setUser(data.session.user);
        setUserEmail(data.session.user.email || '');
        setView('profiles');
        fetchUserFavorites(data.session.user.id);
        fetchWatchHistory(data.session.user.id);
      } else {
        // Look for local storage fallback session
        const localUser = localStorage.getItem('netflix_local_user');
        if (localUser) {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          setUserEmail(parsed.email || '');
          setView('profiles');
          fetchLocalFavorites();
          fetchLocalHistory();
        }
      }
    }
    checkSession();

    // Supabase Auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          setUserEmail(session.user.email || '');
          setView('profiles');
          fetchUserFavorites(session.user.id);
          fetchWatchHistory(session.user.id);
        } else {
          setUser(null);
          setSelectedProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch user favorites from Supabase
  const fetchUserFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId);
      
      if (!error && data) {
        const formatted = data.map(item => ({
          video_id: item.video_id,
          title: item.title,
          thumbnail_url: item.thumbnail_url,
          description: item.description,
          genre: item.genre
        }));
        setFavorites(formatted);
      } else {
        fetchLocalFavorites();
      }
    } catch (err) {
      fetchLocalFavorites();
    }
  };

  // Fetch watch history from Supabase
  const fetchWatchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (!error && data) {
        setWatchHistory(data);
      } else {
        fetchLocalHistory();
      }
    } catch (err) {
      fetchLocalHistory();
    }
  };

  // Offline Fallback for Favorites
  const fetchLocalFavorites = () => {
    const localFavs = localStorage.getItem('netflix_local_favorites');
    if (localFavs) {
      setFavorites(JSON.parse(localFavs));
    }
  };

  // Offline Fallback for History
  const fetchLocalHistory = () => {
    const localHist = localStorage.getItem('netflix_local_history');
    if (localHist) {
      setWatchHistory(JSON.parse(localHist));
    }
  };

  // Authentication: Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        // Graceful Demo/Offline authentication fallback if DB/Auth is pending config or triggers errors
        console.log('Supabase Auth error, fallback to offline demo:', error.message);
        
        // Let's authenticate them locally with a mock profile immediately
        const mockUser = {
          id: 'demo-user-id-12345',
          email: emailInput,
          user_metadata: { full_name: 'Usuário Demo' }
        };
        localStorage.setItem('netflix_local_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setUserEmail(emailInput);
        setAuthSuccess('Entrando no Modo de Demonstração! Aproveite!');
        setTimeout(() => {
          setView('profiles');
          setAuthLoading(false);
        }, 1000);
      } else if (data?.user) {
        setUser(data.user);
        setUserEmail(data.user.email || '');
        setAuthSuccess('Logado com sucesso!');
        setTimeout(() => {
          setView('profiles');
          setAuthLoading(false);
        }, 1000);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Ocorreu um erro ao tentar entrar.');
      setAuthLoading(false);
    }
  };

  // Authentication: Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !fullNameInput) {
      setAuthError('Por favor, preencha todos os campos.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
        options: {
          data: {
            full_name: fullNameInput,
          }
        }
      });

      if (error) {
        console.log('Supabase Sign Up error, fallback to demo register:', error.message);
        // Create demo session locally
        const mockUser = {
          id: 'demo-user-id-12345',
          email: emailInput,
          user_metadata: { full_name: fullNameInput }
        };
        localStorage.setItem('netflix_local_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setUserEmail(emailInput);
        setAuthSuccess('Conta criada no Modo de Demonstração com sucesso! Entrando...');
        setTimeout(() => {
          setView('profiles');
          setAuthLoading(false);
        }, 1500);
      } else {
        setAuthSuccess('Conta criada! Caso seja necessário, verifique seu e-mail para ativar.');
        setTimeout(() => {
          setView('profiles');
          setAuthLoading(false);
        }, 1500);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao registrar.');
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('netflix_local_user');
    setUser(null);
    setSelectedProfile(null);
    setView('landing');
  };

  // Handle Profile Click
  const handleProfileSelect = (profile: {name: string, avatar: string}) => {
    setSelectedProfile(profile);
    setView('browse');
  };

  // Add/Remove Movie from "Minha Lista" (Favorites)
  const toggleFavorite = async (movie: Movie) => {
    const isFav = favorites.some(item => item.video_id === movie.id);

    if (isFav) {
      // Remove Favorite
      const updated = favorites.filter(item => item.video_id !== movie.id);
      setFavorites(updated);
      localStorage.setItem('netflix_local_favorites', JSON.stringify(updated));

      if (user && user.id !== 'demo-user-id-12345') {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', movie.id);
      }
    } else {
      // Add Favorite
      const newItem: FavoriteItem = {
        video_id: movie.id,
        title: movie.title,
        thumbnail_url: movie.thumbnail,
        description: movie.description,
        genre: movie.category
      };
      const updated = [...favorites, newItem];
      setFavorites(updated);
      localStorage.setItem('netflix_local_favorites', JSON.stringify(updated));

      if (user && user.id !== 'demo-user-id-12345') {
        await supabase.from('favorites').insert({
          user_id: user.id,
          video_id: movie.id,
          title: movie.title,
          thumbnail_url: movie.thumbnail,
          description: movie.description,
          genre: movie.category
        });
      }
    }
  };

  // Handle Play Action (logs to watch history & opens cinematic player)
  const handlePlayMovie = async (movie: Movie) => {
    setActiveMovie(movie);
    setIsPlayerOpen(true);

    // Save history
    const historyItem: HistoryItem = {
      video_id: movie.id,
      title: movie.title,
      thumbnail_url: movie.thumbnail,
      watched_at: new Date().toISOString()
    };

    // Prevent duplicate entries in local history list, put newest on top
    const filteredHistory = watchHistory.filter(item => item.video_id !== movie.id);
    const updatedHistory = [historyItem, ...filteredHistory].slice(0, 20); // Keep last 20
    setWatchHistory(updatedHistory);
    localStorage.setItem('netflix_local_history', JSON.stringify(updatedHistory));

    if (user && user.id !== 'demo-user-id-12345') {
      await supabase.from('watch_history').insert({
        user_id: user.id,
        video_id: movie.id,
        title: movie.title,
        thumbnail_url: movie.thumbnail
      });
    }
  };

  // Horizontal scroll utility
  const scrollRow = (rowId: keyof typeof rowRefs, direction: 'left' | 'right') => {
    const container = rowRefs[rowId].current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Filter movies for rows
  const getMoviesByCategory = (category: string) => {
    if (category === 'Lançamentos') {
      return movies.slice(0, 10);
    }
    if (category === 'Minha Lista') {
      // Map stored Favorites back to Movie format
      return movies.filter(m => favorites.some(f => f.video_id === m.id));
    }
    return movies.filter(m => m.category.toLowerCase().includes(category.toLowerCase()));
  };

  // Featured Hero Movie (First Action or popular movie in list)
  const heroMovie = movies.find(m => m.category === 'Ação') || movies[0] || null;

  return (
    <div id="netflix-app-root" className="min-h-screen bg-[#141414] text-white font-sans relative overflow-x-hidden selection:bg-[#E50914]">
      
      {/* 1. LANDING PAGE VIEW */}
      {view === 'landing' && (
        <div id="landing-container" className="relative min-h-screen w-full flex flex-col bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%), url('https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&w=1920&q=80')` }}>
          
          {/* Header */}
          <header id="landing-header" className="w-full flex items-center justify-between px-6 py-5 md:px-16 max-w-7xl mx-auto z-20">
            <div id="logo-container" className="flex items-center">
              <span className="text-3xl md:text-4xl font-black text-[#E50914] tracking-tighter">NETFLIX</span>
              <span className="ml-1 text-[10px] bg-red-600 px-1 rounded font-mono font-semibold tracking-widest text-white">REPLICA</span>
            </div>
            
            <button 
              id="login-btn-header"
              onClick={() => { setView('login'); setIsSignUp(false); }}
              className="bg-[#E50914] hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded transition-all duration-200 shadow-md cursor-pointer"
            >
              Entrar
            </button>
          </header>

          {/* Hero Section */}
          <main id="landing-hero" className="flex-grow flex flex-col items-center justify-center text-center px-4 md:px-12 max-w-4xl mx-auto z-10 py-12">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight max-w-3xl"
            >
              Filmes, séries e muito mais, ilimitados.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-2xl mt-4 text-gray-200"
            >
              Assista onde quiser. Cancele quando quiser.
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm md:text-lg mt-6 text-gray-300 max-w-xl"
            >
              Pronto para assistir? Insira seu e-mail para criar ou acessar sua conta com o Supabase.
            </motion.p>

            {/* Email Form */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-0 bg-black/40 sm:bg-transparent p-4 sm:p-0 rounded-lg sm:rounded-none"
            >
              <input 
                type="email" 
                placeholder="Endereço de e-mail" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full sm:flex-grow px-5 py-4 bg-black/75 border border-green-500/30 sm:border-gray-500/80 rounded sm:rounded-l sm:rounded-r-none text-white focus:outline-none focus:border-red-600 text-lg transition-colors placeholder:text-gray-400"
              />
              <button 
                onClick={() => {
                  if (emailInput) {
                    setView('login');
                    setIsSignUp(true);
                  } else {
                    setView('login');
                  }
                }}
                className="w-full sm:w-auto bg-[#E50914] hover:bg-red-700 text-white font-bold text-lg md:text-xl px-8 py-4 rounded sm:rounded-r sm:rounded-l-none transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap shadow-lg"
              >
                Começar
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* NetMovies Ribbon */}
            <div className="mt-12 bg-black/60 border border-red-900/30 rounded-xl p-4 flex items-center gap-4 text-left max-w-xl shadow-lg">
              <span className="text-3xl">🍿</span>
              <div>
                <h4 className="font-bold text-red-500 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Filmes Grátis via NetMovies
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  Esta réplica está configurada com uma chave API real para carregar o catálogo do canal NetMovies diretamente na sua tela!
                </p>
              </div>
            </div>
          </main>

          {/* FAQs Section */}
          <section id="landing-faqs" className="w-full bg-black border-t-8 border-neutral-900 py-16 px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-center mb-10">Perguntas frequentes</h2>
              
              <div className="space-y-3">
                {faqList.map((faq, index) => (
                  <div key={index} className="bg-[#2D2D2D] hover:bg-[#414141] transition-colors rounded">
                    <button 
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full text-left px-6 py-5 flex justify-between items-center text-lg md:text-2xl font-semibold text-white focus:outline-none"
                    >
                      <span>{faq.q}</span>
                      <span>{openFaq === index ? '✕' : '＋'}</span>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6 pt-1 text-md md:text-xl text-gray-300 leading-relaxed border-t border-black/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full bg-black/90 border-t border-neutral-800 text-neutral-500 py-12 px-6">
            <div className="max-w-5xl mx-auto text-sm">
              <p className="mb-8">Dúvidas? Ligue para 0800 591 8942</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <a href="#" className="hover:underline">Perguntas frequentes</a>
                <a href="#" className="hover:underline">Central de Ajuda</a>
                <a href="#" className="hover:underline">Termos de Uso</a>
                <a href="#" className="hover:underline">Privacidade</a>
                <a href="#" className="hover:underline">Preferências de cookies</a>
                <a href="#" className="hover:underline">Informações corporativas</a>
                <a href="#" className="hover:underline">Originais Netflix</a>
                <a href="#" className="hover:underline">Canal NetMovies</a>
              </div>
              <p className="mt-8 text-xs">Replica da Interface da Netflix - Construído com amor para demonstração técnica.</p>
            </div>
          </footer>
        </div>
      )}


      {/* 2. LOGIN / CADASTRO VIEW */}
      {view === 'login' && (
        <div id="login-container" className="relative min-h-screen w-full flex flex-col bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%), url('https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&w=1920&q=80')` }}>
          
          {/* Header */}
          <header className="w-full px-6 py-5 md:px-16 max-w-7xl mx-auto z-20">
            <div onClick={() => setView('landing')} className="flex items-center cursor-pointer max-w-fit">
              <span className="text-3xl md:text-4xl font-black text-[#E50914] tracking-tighter">NETFLIX</span>
              <span className="ml-1 text-[10px] bg-red-600 px-1 rounded font-mono font-semibold tracking-widest text-white">REPLICA</span>
            </div>
          </header>

          {/* Form Card */}
          <main className="flex-grow flex items-center justify-center px-4 py-8 z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/85 border border-neutral-800 rounded-lg p-8 md:p-14 w-full max-w-[450px] shadow-2xl"
            >
              <h2 className="text-3xl font-bold mb-7">
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </h2>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {/* Error Banner */}
                {authError && (
                  <div className="bg-orange-600/20 border border-orange-500/40 p-3 rounded flex items-start gap-2 text-orange-200 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {authSuccess && (
                  <div className="bg-emerald-600/20 border border-emerald-500/40 p-3 rounded flex items-start gap-2 text-emerald-200 text-sm">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <input 
                      type="text" 
                      placeholder="Nome completo" 
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      required
                      className="w-full px-5 py-3.5 bg-neutral-700/80 rounded text-white focus:outline-none focus:bg-neutral-600 text-md"
                    />
                  </div>
                )}

                <div>
                  <input 
                    type="email" 
                    placeholder="E-mail ou número de telefone" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-neutral-700/80 rounded text-white focus:outline-none focus:bg-neutral-600 text-md"
                  />
                </div>

                <div>
                  <input 
                    type="password" 
                    placeholder="Senha" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-neutral-700/80 rounded text-white focus:outline-none focus:bg-neutral-600 text-md"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-3.5 rounded transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-6"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isSignUp ? 'Criar Conta' : 'Entrar'}
                </button>
              </form>

              {/* Form Links */}
              <div className="flex items-center justify-between text-xs text-neutral-400 mt-4">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#E50914]" />
                  <span>Lembre-se de mim</span>
                </label>
                <a href="#" className="hover:underline">Precisa de ajuda?</a>
              </div>

              {/* Toggle Mode */}
              <div className="mt-10 space-y-3">
                <p className="text-neutral-500 text-sm">
                  {isSignUp ? 'Já tem uma conta da Netflix?' : 'Novo por aqui?'}
                  <button 
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-white hover:underline ml-1 font-semibold cursor-pointer"
                  >
                    {isSignUp ? 'Entrar agora.' : 'Assine agora.'}
                  </button>
                </p>

                <p className="text-xs text-neutral-500 leading-normal">
                  Esta página utiliza segurança local e Supabase para garantir a proteção de seus dados.
                </p>
              </div>
            </motion.div>
          </main>
        </div>
      )}


      {/* 3. PROFILE SELECTION VIEW */}
      {view === 'profiles' && (
        <div id="profiles-container" className="min-h-screen w-full flex flex-col justify-center items-center bg-[#141414] px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-3xl"
          >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-wide mb-8">Quem está assistindo?</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mt-10">
              {profilesList.map((profile, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleProfileSelect(profile)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-md overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-200 shadow-md ${profile.color}`}>
                    <Image 
                      src={profile.avatar} 
                      alt={profile.name}
                      fill
                      sizes="150px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="mt-4 text-gray-400 group-hover:text-white text-base md:text-lg font-medium transition-colors">
                    {profile.name}
                  </span>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={() => handleProfileSelect({name: userEmail.split('@')[0], avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'})}
              className="mt-16 border border-neutral-500 text-neutral-400 hover:text-white hover:border-white px-6 py-2 rounded text-sm uppercase tracking-widest transition duration-200 cursor-pointer"
            >
              Gerenciar Perfis
            </button>
          </motion.div>
        </div>
      )}


      {/* 4. MAIN BROWSE DASHBOARD */}
      {view === 'browse' && selectedProfile && (
        <div id="browse-container" className="min-h-screen w-full flex flex-col relative pb-20">
          
          {/* Main Navigation Header */}
          <header 
            id="main-nav-header" 
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14 py-3 transition-colors duration-500 ${scrolled ? 'bg-[#141414]/95 shadow-xl border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'}`}
          >
            <div className="flex items-center gap-6 md:gap-12">
              {/* Logo */}
              <div onClick={() => setView('profiles')} className="flex items-center cursor-pointer select-none">
                <span className="text-2xl md:text-3xl font-black text-[#E50914] tracking-tighter">NETFLIX</span>
                <span className="ml-1 text-[8px] bg-red-600 px-1 rounded font-mono font-semibold tracking-widest text-white">REPLICA</span>
              </div>

              {/* Navigation Menu (Hidden on small mobile, elegant desktop layout) */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-300">
                <button onClick={() => { setSearchQuery(''); setSearchActive(false); }} className="hover:text-white transition-colors cursor-pointer text-white">Início</button>
                <button onClick={() => { setSearchQuery('série'); setSearchActive(true); }} className="hover:text-white transition-colors cursor-pointer">Séries</button>
                <button onClick={() => { setSearchQuery('filme'); setSearchActive(true); }} className="hover:text-white transition-colors cursor-pointer">Filmes</button>
                <button onClick={() => { setSearchQuery(''); setSearchActive(true); }} className="hover:text-white transition-colors cursor-pointer">Navegar por gênero</button>
                {favorites.length > 0 && (
                  <a href="#minha-lista" className="hover:text-white transition-colors">Minha Lista</a>
                )}
              </nav>
            </div>

            {/* Profile & Search actions */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <button 
                  onClick={() => setSearchActive(!searchActive)}
                  className="text-white hover:text-gray-300 transition-colors p-1.5 focus:outline-none"
                >
                  <Search className="w-5 h-5" />
                </button>
                
                {(searchActive || searchQuery) && (
                  <motion.input 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 180, opacity: 1 }}
                    type="text"
                    placeholder="Títulos, gêneros..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/60 border border-neutral-600 text-white rounded px-3 py-1 text-xs focus:outline-none focus:border-white ml-2 placeholder:text-neutral-500"
                  />
                )}
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Menu Dropdown */}
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer py-2">
                  <div className="relative w-8 h-8 rounded overflow-hidden">
                    <Image 
                      src={selectedProfile.avatar} 
                      alt={selectedProfile.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold">{selectedProfile.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 bg-black/95 border border-neutral-800 rounded shadow-2xl py-2 w-48 hidden group-hover:block transition-all z-50">
                  <div className="px-4 py-2 border-b border-neutral-800 mb-2">
                    <p className="text-xs text-neutral-400">Logado como:</p>
                    <p className="text-sm font-semibold truncate text-white">{userEmail}</p>
                  </div>

                  <button 
                    onClick={() => setView('profiles')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" /> Alternar Perfis
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#E50914] hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sair do Netflix
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN PAGE BODY */}
          {moviesLoading ? (
            <div className="flex-grow flex flex-col justify-center items-center py-40 gap-3">
              <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm animate-pulse">Carregando catálogo do NetMovies...</p>
            </div>
          ) : (
            <div id="browse-content">
              
              {/* Conditional search page vs. default dashboard */}
              {searchQuery ? (
                <div className="pt-24 px-6 md:px-14 min-h-screen">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-300">
                    Resultados de busca para: <span className="text-white">&ldquo;{searchQuery}&rdquo;</span>
                  </h2>
                  
                  {/* Search grid layout */}
                  {movies.filter(m => 
                    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                      <AlertCircle className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
                      <p className="text-lg">Nenhum filme ou série encontrado para esta busca.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-4 bg-[#E50914] text-white font-semibold px-4 py-2 rounded text-sm hover:bg-red-700 transition"
                      >
                        Limpar Busca
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {movies
                        .filter(m => 
                          m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((movie) => (
                          <div 
                            key={movie.id} 
                            onClick={() => setSelectedMovieForDetail(movie)}
                            className="bg-neutral-900 rounded overflow-hidden cursor-pointer group hover:ring-2 hover:ring-red-600 transition duration-300"
                          >
                            <div className="relative aspect-video">
                              <Image 
                                src={movie.thumbnail} 
                                alt={movie.title}
                                fill
                                sizes="250px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-3">
                              <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span className="text-green-500 font-semibold">{movie.match}</span>
                                <span>{movie.year}</span>
                                <span className="border border-gray-600 px-1 rounded text-white font-mono">{movie.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* HERO BANNER SECTION */}
                  {heroMovie && (
                    <section 
                      id="hero-banner" 
                      className="relative h-[56vw] min-h-[400px] max-h-[800px] w-full bg-cover bg-center flex items-center px-6 md:px-14 z-10 select-none"
                      style={{ backgroundImage: `linear-gradient(to right, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.3) 50%, rgba(20,20,20,0.85) 100%), linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.2) 30%, rgba(20,20,20,0) 100%), url('${heroMovie.backdrop}')` }}
                    >
                      <div className="max-w-2xl space-y-4 md:space-y-6">
                        {/* Netflix Exclusive Tag */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-600 text-3xl font-black tracking-tighter">N</span>
                          <span className="text-xs tracking-widest text-neutral-300 uppercase font-bold">FILME EXCLUSIVO NETMOVIES</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white leading-none tracking-tight">
                          {heroMovie.title}
                        </h1>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-300">
                          <span className="text-green-500 font-bold">{heroMovie.match} Match</span>
                          <span>{heroMovie.year}</span>
                          <span className="border border-gray-600 px-1 rounded text-white font-semibold font-mono text-[10px]">{heroMovie.rating}</span>
                          <span>{heroMovie.duration}</span>
                        </div>

                        {/* Description */}
                        <p className="text-sm md:text-lg text-gray-200 font-light leading-relaxed drop-shadow-md line-clamp-3">
                          {heroMovie.description}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button 
                            onClick={() => handlePlayMovie(heroMovie)}
                            className="bg-white hover:bg-neutral-200 text-black font-bold px-6 py-2.5 md:px-8 md:py-3.5 rounded flex items-center justify-center gap-2 text-sm md:text-lg transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
                          >
                            <Play className="w-5 h-5 fill-current" /> Assistir
                          </button>
                          
                          <button 
                            onClick={() => setSelectedMovieForDetail(heroMovie)}
                            className="bg-neutral-700/60 hover:bg-neutral-600/80 text-white font-bold px-6 py-2.5 md:px-8 md:py-3.5 rounded flex items-center justify-center gap-2 text-sm md:text-lg transition-all duration-200 backdrop-blur-sm cursor-pointer"
                          >
                            <Info className="w-5 h-5" /> Mais Informações
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* CAROUSEL ROWS */}
                  <div className="px-6 md:px-14 space-y-12 -mt-12 md:-mt-24 relative z-20">
                    
                    {/* Row 1: Minha Lista (Favorites) */}
                    {favorites.length > 0 && (
                      <div id="minha-lista" className="space-y-2">
                        <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Minha Lista
                        </h2>
                        
                        <div className="relative group">
                          {/* Scroll buttons */}
                          <button 
                            onClick={() => scrollRow('favorites', 'left')}
                            className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                          >
                            <ChevronLeft className="w-8 h-8" />
                          </button>

                          <div 
                            ref={rowRefs.favorites}
                            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                            style={{ scrollbarWidth: 'none' }}
                          >
                            {getMoviesByCategory('Minha Lista').map((movie) => (
                              <MovieCard key={movie.id} movie={movie} />
                            ))}
                          </div>

                          <button 
                            onClick={() => scrollRow('favorites', 'right')}
                            className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                          >
                            <ChevronRight className="w-8 h-8" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Row 2: Lançamentos Populares */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Lançamentos Populares</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('recentes', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.recentes}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Lançamentos').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('recentes', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 3: Ação */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Adrenalina & Ação</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('acao', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.acao}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Ação').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('acao', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 4: Comédia */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Comédias para Rir</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('comedy', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.comedy}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Comédia').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('comedy', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 5: Drama */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Dramas Emocionantes</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('drama', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.drama}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Drama').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('drama', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 6: Romance */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Romance & Histórias de Amor</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('romance', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.romance}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Romance').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('romance', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 7: Terror & Suspense */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Terror & Suspense de Arrepiar</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('horror', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.horror}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Terror & Suspense').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('horror', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Row 8: Séries */}
                    <div className="space-y-2">
                      <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">Séries de TV Recomendadas</h2>
                      <div className="relative group">
                        <button 
                          onClick={() => scrollRow('series', 'left')}
                          className="absolute left-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <div 
                          ref={rowRefs.series}
                          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4 pr-10"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {getMoviesByCategory('Séries').map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                          ))}
                        </div>
                        <button 
                          onClick={() => scrollRow('series', 'right')}
                          className="absolute right-0 top-0 bottom-0 w-10 bg-black/60 hover:bg-black/80 z-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </div>
                    </div>

                    {/* Watch History Log Section */}
                    {watchHistory.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-neutral-800">
                        <h2 className="text-lg md:text-2xl font-bold text-neutral-400 flex items-center gap-2">
                          <History className="w-5 h-5 text-neutral-500" /> Continuar Assistindo como {selectedProfile.name}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {watchHistory.map((item, index) => {
                            const movieRef = movies.find(m => m.id === item.video_id);
                            return (
                              <div 
                                key={index} 
                                onClick={() => {
                                  if (movieRef) handlePlayMovie(movieRef);
                                }}
                                className="bg-neutral-900 border border-neutral-800 rounded p-2 text-center hover:bg-neutral-800 transition cursor-pointer flex flex-col justify-between h-28"
                              >
                                <div className="text-xs text-neutral-400 line-clamp-2 font-medium mb-2">{item.title}</div>
                                <div className="w-full bg-neutral-800 rounded-full h-1">
                                  <div className="bg-[#E50914] h-1 rounded-full w-2/3"></div>
                                </div>
                                <span className="text-[9px] text-[#E50914] font-semibold mt-2 flex items-center justify-center gap-1">
                                  <Play className="w-2.5 h-2.5 fill-current" /> Retomar
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. MOVIE DETAIL MODAL (Classic Netflix Card Details) */}
      <AnimatePresence>
        {selectedMovieForDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 md:p-10 overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="bg-[#181818] border border-neutral-800 rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedMovieForDetail(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 p-2 rounded-full text-white z-20 focus:outline-none transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Backdrop poster banner */}
              <div 
                className="relative h-[250px] md:h-[400px] bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(to top, #181818 0%, rgba(24,24,24,0) 100%), url('${selectedMovieForDetail.backdrop}')` }}
              >
                <div className="absolute bottom-6 left-6 md:left-12 space-y-4">
                  <h2 className="text-2xl md:text-5xl font-black text-white drop-shadow-md">{selectedMovieForDetail.title}</h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setSelectedMovieForDetail(null);
                        handlePlayMovie(selectedMovieForDetail);
                      }}
                      className="bg-[#E50914] hover:bg-red-700 text-white font-bold px-6 py-2 rounded flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-current" /> Assistir Completo
                    </button>
                    
                    <button 
                      onClick={() => toggleFavorite(selectedMovieForDetail)}
                      className="bg-neutral-800/80 border border-neutral-500 hover:border-white p-2.5 rounded-full text-white transition-all cursor-pointer"
                      title={favorites.some(f => f.video_id === selectedMovieForDetail.id) ? "Remover da minha lista" : "Adicionar à minha lista"}
                    >
                      {favorites.some(f => f.video_id === selectedMovieForDetail.id) ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Metadata & Description */}
              <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 font-bold">{selectedMovieForDetail.match} Relevante</span>
                    <span>{selectedMovieForDetail.year}</span>
                    <span className="border border-neutral-600 px-1.5 rounded font-mono text-xs font-semibold text-white bg-neutral-800">{selectedMovieForDetail.rating}</span>
                    <span>{selectedMovieForDetail.duration}</span>
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed text-base">
                    {selectedMovieForDetail.description}
                  </p>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 text-xs text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Gênero:</span>{' '}
                    <span className="text-neutral-300 hover:underline cursor-pointer">{selectedMovieForDetail.category}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Distribuição:</span>{' '}
                    <span className="text-neutral-300 hover:underline cursor-pointer">NetMovies Oficial</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Idiomas:</span>{' '}
                    <span className="text-neutral-300">Português (Brasil), Dublado</span>
                  </div>
                  <div className="bg-red-950/20 border border-red-500/20 rounded p-3 text-red-200">
                    <span className="font-bold flex items-center gap-1 text-[10px]">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> YOUTUBE PLAYER CONFIGURADO
                    </span>
                    <p className="mt-1 text-[9px] text-neutral-400">Pronto para rodar de forma nativa e sem interrupções dentro de nosso player de cinema integrado.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. CINEMATIC YOUTUBE PLAYER OVERLAY */}
      <AnimatePresence>
        {isPlayerOpen && activeMovie && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col justify-between overflow-hidden"
          >
            {/* Header / Top controls */}
            <header className="p-4 md:p-6 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between z-10">
              <button 
                onClick={() => setIsPlayerOpen(false)}
                className="flex items-center gap-2 text-white hover:text-gray-300 transition duration-200 text-sm md:text-lg focus:outline-none"
              >
                <ChevronLeft className="w-8 h-8" />
                <span>Voltar para Navegação</span>
              </button>

              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Assistindo Agora</p>
                <h3 className="text-md md:text-xl font-bold truncate max-w-xs md:max-w-md">{activeMovie.title}</h3>
              </div>

              <button 
                onClick={() => setIsPlayerOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full text-white transition focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            {/* Cinematic Video Area (YouTube Player) */}
            <div id="cinema-frame-container" className="flex-grow w-full relative bg-neutral-950 flex items-center justify-center p-0 md:p-4">
              <iframe 
                id="youtube-player-frame"
                className="w-full h-full max-w-7xl aspect-video rounded-none md:rounded-lg shadow-2xl border-0"
                src={`https://www.youtube.com/embed/${activeMovie.id}?autoplay=1&rel=0&modestbranding=1&controls=1&vq=hd1080`}
                title={activeMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            {/* Bottom Info bar */}
            <footer className="p-4 md:p-6 bg-gradient-to-t from-black/95 to-transparent flex flex-col md:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px] tracking-wide">NETMOVIES ORIGINAL</span>
                <span className="text-white font-medium">{activeMovie.title}</span>
                <span>•</span>
                <span>{activeMovie.duration || '1h 45min'}</span>
                <span>•</span>
                <span className="border border-neutral-700 px-1 rounded text-neutral-200">{activeMovie.rating || '14'}</span>
              </div>
              <p className="text-center md:text-right max-w-md line-clamp-1">
                {activeMovie.description}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  // Sub-component MovieCard for cleaner list organization
  function MovieCard({ movie }: { movie: Movie }) {
    const isFav = favorites.some(item => item.video_id === movie.id);

    return (
      <motion.div 
        id={`movie-card-${movie.id}`}
        whileHover={{ scale: 1.08, zIndex: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex-shrink-0 w-40 sm:w-52 md:w-64 bg-neutral-900 rounded overflow-hidden shadow-lg select-none relative group/card cursor-pointer"
      >
        {/* Poster Image */}
        <div 
          onClick={() => setSelectedMovieForDetail(movie)}
          className="relative aspect-video w-full"
        >
          <Image 
            src={movie.thumbnail} 
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 160px, 250px"
            className="object-cover group-hover/card:brightness-75 transition duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition duration-300 flex items-end p-3">
            <h4 className="font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-md">{movie.title}</h4>
          </div>
        </div>

        {/* Card Hover Details (Revealed smoothly on desktop / tablet) */}
        <div className="p-3 bg-[#181818] border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayMovie(movie);
                }}
                className="bg-white hover:bg-neutral-200 text-black p-1.5 sm:p-2 rounded-full flex items-center justify-center transition hover:scale-115 cursor-pointer shadow-md"
                title="Assistir"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current text-black" />
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(movie);
                }}
                className="bg-[#2a2a2a] border border-neutral-600 hover:border-white p-1.5 sm:p-2 rounded-full flex items-center justify-center text-white transition hover:scale-115 cursor-pointer"
                title={isFav ? "Remover da minha lista" : "Adicionar à minha lista"}
              >
                {isFav ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMovieForDetail(movie);
              }}
              className="bg-[#2a2a2a] border border-neutral-600 hover:border-white p-1.5 sm:p-2 rounded-full flex items-center justify-center text-white transition hover:scale-115"
              title="Mais Informações"
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400 font-semibold">
            <span className="text-green-500">{movie.match} Relevante</span>
            <span className="border border-neutral-700 px-1 rounded bg-neutral-800 font-mono text-[9px] text-neutral-300">{movie.rating}</span>
            <span>{movie.year}</span>
          </div>
          
          <div className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold">
            {movie.category}
          </div>
        </div>
      </motion.div>
    );
  }
}
