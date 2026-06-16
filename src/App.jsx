import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MatchCard from './components/MatchCard';
import MatchDetails from './components/MatchDetails';
import LeagueDetails from './components/LeagueDetails';
import TeamDetails from './components/TeamDetails';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { ShieldAlert, CalendarClock, Trophy } from 'lucide-react';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { API_BASE_URL } from './config';

export default function App() {
  const [selectedDate, setSelectedDate] = useState('');
  const [games, setGames] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [filterLive, setFilterLive] = useState(false);
  const [modalStack, setModalStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Authentication State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        try {
          // Fetch or create user record in Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            const userData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString(),
              isPremium: false,
              premiumUntil: null,
              planType: 'free'
            };
            await setDoc(userDocRef, userData);
            setUser(userData);
            
            // Enviar correo de bienvenida
            try {
              await fetch(`${API_BASE_URL}/api/welcome_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUser.email, displayName: currentUser.displayName })
              });
            } catch (err) {
              console.error("Error sending welcome email:", err);
            }
          } else {
            let userData = userSnap.data();
            
            // 1. ADMIN OVERRIDE: Este correo siempre será Premium
            if (userData.email === 'danielgarciagonzalezarmenia@gmail.com') {
              userData.isPremium = true;
            } 
            // 2. EXPIRATION CHECK: Si es premium pero ya pasó la fecha
            else if (userData.isPremium && userData.premiumUntil) {
              const now = new Date();
              const expiration = new Date(userData.premiumUntil);
              if (now > expiration) {
                // Se acabó el mes de Premium
                userData.isPremium = false;
                userData.premiumUntil = null;
                userData.planType = 'free';
                // Actualizamos la base de datos para quitarle el premium definitivamente
                setDoc(userDocRef, { 
                  isPremium: false, 
                  premiumUntil: null, 
                  planType: 'free' 
                }, { merge: true }).catch(console.error);
              }
            }

            setUser(userData);
          }
        } catch (err) {
          console.error("Error setting up user in Firestore:", err);
          // Fallback to local auth object if firestore fails (e.g. offline or permission rules)
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            isPremium: false,
            planType: 'free'
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const openModal = (type, id) => {
    setModalStack(prev => [...prev, { type, id: Number(id) }]);
  };

  const goBack = () => {
    setModalStack(prev => prev.slice(0, -1));
  };

  const closeAll = () => {
    setModalStack([]);
  };

  // Store scores of matches to detect new goals and trigger confetti
  const prevScoresRef = useRef({});

  // Helper to format Date to DD/MM/YYYY
  const getTodayDateString = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Set today as initial date
  useEffect(() => {
    setSelectedDate(getTodayDateString());
  }, []);

  const fetchData = async (showLoading = true) => {
    if (!selectedDate) return;
    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/games?date=${selectedDate}&_=${Date.now()}`);
      const data = response.data;
      
      const newGames = data.games || [];
      const newCompetitions = data.competitions || [];

      // Check for goals to trigger confetti
      if (selectedDate === getTodayDateString()) {
        checkForGoals(newGames);
      }

      setGames(newGames);
      setCompetitions(newCompetitions);
      setError(null);
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (showLoading) {
        setError('Ocurrió un error al obtener la lista de partidos.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch games on date changes
  useEffect(() => {
    fetchData(true);
  }, [selectedDate]);

  // Live polling every 15 seconds if today's date is selected
  useEffect(() => {
    if (!selectedDate || selectedDate !== getTodayDateString()) return;

    const interval = setInterval(() => {
      console.log('Polling live scores...');
      fetchData(false); // fetch silently without skeleton flash
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Goal detector function
  const checkForGoals = (currentGames) => {
    const prevScores = prevScoresRef.current;
    const currentScores = {};

    currentGames.forEach(game => {
      const home = game.homeCompetitor;
      const away = game.awayCompetitor;

      // Only track matches that are live or just ended
      if (game.statusGroup === 3 || game.statusGroup === 4) {
        const key = game.id;
        const currentHomeScore = home.score !== -1 ? home.score : 0;
        const currentAwayScore = away.score !== -1 ? away.score : 0;
        
        currentScores[key] = { home: currentHomeScore, away: currentAwayScore };

        // If we have a record of this match, compare scores
        if (prevScores[key]) {
          const scoreChanged = 
            currentHomeScore > prevScores[key].home || 
            currentAwayScore > prevScores[key].away;

          // Trigger confetti if score increased in a live match
          if (scoreChanged && game.statusGroup === 3) {
            console.log(`GOAL! Triggering confetti celebration for match ${game.id}`);
            triggerCelebration();
          }
        }
      }
    });

    prevScoresRef.current = currentScores;
  };

  const triggerCelebration = () => {
    // Left side confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 }
    });
    // Right side confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 }
    });
  };

  // Filter games based on sidebar selections
  const getFilteredGames = () => {
    let list = games;

    if (filterLive) {
      list = list.filter(g => g.statusGroup === 3); // 3 is Live
    }

    if (selectedLeagueId) {
      list = list.filter(g => g.competitionId === selectedLeagueId);
    }

    return list;
  };

  // Group games by competition (prioritize Mundial/World Cup)
  const getGroupedGames = (filteredList) => {
    const groups = {};
    const compMap = {};
    
    competitions.forEach(c => {
      compMap[c.id] = c;
    });

    filteredList.forEach(game => {
      const cid = game.competitionId;
      if (!groups[cid]) {
        groups[cid] = {
          competition: compMap[cid] || { name: game.competitionDisplayName || 'Otras Ligas', id: cid },
          games: []
        };
      }
      groups[cid].games.push(game);
    });

    // Sort: World Cup 2026 (ID 5930) first, then by popularityRank
    return Object.values(groups).sort((a, b) => {
      const isAMundial = a.competition.id === 5930 || a.competition.name.toLowerCase().includes('mundial') || a.competition.name.toLowerCase().includes('world cup');
      const isBMundial = b.competition.id === 5930 || b.competition.name.toLowerCase().includes('mundial') || b.competition.name.toLowerCase().includes('world cup');
      
      if (isAMundial && !isBMundial) return -1;
      if (!isAMundial && isBMundial) return 1;
      
      return (b.competition.popularityRank || 0) - (a.competition.popularityRank || 0);
    });
  };

  const filtered = getFilteredGames();
  const grouped = getGroupedGames(filtered);

  // Filtered competitions (leagues that have games in the loaded dataset)
  const activeLeagues = competitions.filter(comp => {
    return games.some(g => g.competitionId === comp.id);
  });

  // League Logo CDN Helper
  const getLeagueLogo = (id) => {
    return `https://imagecache.365scores.com/image/upload/f_auto,w_64,h_64,c_limit,q_auto:eco,d_competitions:default1.png/competitions/${id}`;
  };

  const renderSkeletons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: '90px', width: '100%', borderRadius: '16px' }} />
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', paddingBottom: '40px' }}>
      
      {/* Top Banner Navigation */}
      <Header 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        filterLive={filterLive}
        setFilterLive={setFilterLive}
        competitions={activeLeagues}
        selectedLeagueId={selectedLeagueId}
        setSelectedLeagueId={setSelectedLeagueId}
        onRefresh={() => fetchData(true)}
        loading={loading}
        onOpenModal={openModal}
        user={user}
        authLoading={authLoading}
        onLogin={handleLogin}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: '800px' }}>
          {loading ? (
            renderSkeletons()
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '40px 16px', padding: '24px', textAlign: 'center' }} className="glass-panel">
              <ShieldAlert size={40} color="var(--danger)" />
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{error}</span>
              <button 
                onClick={() => fetchData(true)}
                style={{ padding: '8px 16px', border: '1px solid var(--accent-emerald)', background: 'rgba(13,240,163,0.1)', color: 'var(--accent-emerald)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Reintentar
              </button>
            </div>
          ) : grouped.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '40px 16px', padding: '40px 24px', textAlign: 'center' }} className="glass-panel">
              <CalendarClock size={40} color="var(--text-muted)" />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>No hay partidos</h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {filterLive ? 'No hay partidos en vivo jugando en este momento.' : 'No hay partidos programados para esta fecha.'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {grouped.map(group => (
                <div key={group.competition.id} style={{ marginBottom: '16px' }}>
                  
                  {/* League Header */}
                  <div 
                    onClick={() => openModal('league', group.competition.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 8px', 
                      marginBottom: '10px',
                      cursor: 'pointer'
                    }}
                    className="league-header-click"
                  >
                    <img 
                      src={getLeagueLogo(group.competition.id)} 
                      alt={group.competition.name}
                      style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = 'https://imagecache.365scores.com/image/upload/d_competitions:default1.png/competitions/default1'; }}
                    />
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {group.competition.name}
                    </h3>
                  </div>

                  {/* Matches under this league */}
                  {group.games.map(game => (
                    <MatchCard 
                      key={game.id} 
                      game={game} 
                      competitionName={group.competition.name}
                      onClick={(id) => openModal('match', id)}
                    />
                  ))}

                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals Stack System */}
      {modalStack.length > 0 && (() => {
        const activeModal = modalStack[modalStack.length - 1];
        switch (activeModal.type) {
          case 'match':
            return (
              <MatchDetails 
                matchId={activeModal.id} 
                user={user}
                onClose={goBack} 
                onClear={closeAll}
                onOpenModal={openModal}
              />
            );
          case 'league':
            return (
              <LeagueDetails 
                leagueId={activeModal.id} 
                onClose={goBack} 
                onClear={closeAll}
                onOpenModal={openModal}
              />
            );
          case 'team':
            return (
              <TeamDetails 
                teamId={activeModal.id} 
                onClose={goBack} 
                onClear={closeAll}
                onOpenModal={openModal}
              />
            );
          default:
            return null;
        }
      })()}
    </div>
  );
}
