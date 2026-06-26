/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './components/LanguageToggle';
import { supabase } from '@/integrations/supabase/client';
import { SECRET_ROOM_URL } from './lib/external-links';
import secretRoomMark from './assets/secret-room-mark.png.asset.json';
import { Player, RoleType, GamePhase, GameLog, Cabinet, Identity } from './types';
import { initializePlayers, calculateMasonCount, calculatePrisonCapacity, hasInitialShield, generateId, playTimerSound } from './utils';
import { ROLE_DETAILS } from './constants';
import PlayerCard from './components/PlayerCard';
import { CollapsibleGuide } from './components/CollapsibleGuide';
import ModeratorGuide from './components/ModeratorGuide';
import Day0Setup from './components/Day0Setup';
import NightWizard from './components/NightWizard';
import Night0Terrorist from './components/Night0Terrorist';
import ChaosPhase from './components/ChaosPhase';
import SearchManager from './components/SearchManager';
import SpeakingTimer from './components/SpeakingTimer';
import { ConditionsModal } from './components/ConditionsModal';
import { tl } from './i18n';
import {
  Users,
  UserPlus,
  Shield,
  Moon,
  Sun,
  Scale,
  RotateCcw,
  Eye,
  EyeOff,
  HelpCircle,
  Clock,
  UserCheck,
  Zap,
  CheckCircle,
  Skull,
  TrendingUp,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  User,
  LogOut,
  Home
} from 'lucide-react';

import coverAsset from './assets/game_cover.jpg.asset.json';
import coverAssetEn from './assets/game_cover_en.jpg.asset.json';
import gameLogoAsset from './assets/game-logo.png.asset.json';

const isDevMode = 
  (import.meta as any).env?.DEV || 
  (typeof window !== 'undefined' && 
   (window.location.hostname === 'localhost' || 
    window.location.hostname.includes('127.0.0.1') || 
    window.location.hostname.includes('ais-dev')));

export default function App() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language !== 'en';
  const coverImg = i18n.language === 'en' ? coverAssetEn.url : coverAsset.url;
  const logoImg = gameLogoAsset.url;
  // Game Setup States
  const [playerInput, setPlayerInput] = useState<string>(() => {
    return localStorage.getItem('president_playerInput') || tl('مهرداد, نیما, سپیده, آرمان, صبا, کیوان, بهار, رامین, رویا, سینا', 'Mehrdad, Nima, Sepideh, Arman, Saba, Kayvan, Bahar, Ramin, Roya, Sina');
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('president_players');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing president_players from localStorage:', e);
      }
    }
    return [];
  });
  const [gamePhase, setGamePhase] = useState<GamePhase>(() => {
    return (localStorage.getItem('president_gamePhase') as GamePhase) || 'setup';
  });
  const [cycleNumber, setCycleNumber] = useState<number>(() => {
    const saved = localStorage.getItem('president_cycleNumber');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [logs, setLogs] = useState<GameLog[]>(() => {
    const saved = localStorage.getItem('president_logs');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data)) return data;
      } catch (e) {
        console.error('Error parsing president_logs from localStorage:', e);
      }
    }
    return [];
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authInfo, setAuthInfo] = useState('');

  useEffect(() => {
    // Subscribe FIRST so we never miss an event, then hydrate the current session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setAuthLoading(true);
    const email = authEmail.trim();
    if (authMode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: authPassword });
      setAuthLoading(false);
      if (error) { setAuthError(t('auth.error')); return; }
      setAuthPassword('');
    } else if (authMode === 'signup') {
      if (authPassword.length < 6) {
        setAuthLoading(false);
        setAuthError(t('auth.passwordMin'));
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      setAuthLoading(false);
      if (error) { setAuthError(error.message); return; }
      setAuthInfo(t('auth.signUpSuccess'));
      setAuthPassword('');
      setAuthMode('signin');
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setAuthLoading(false);
      if (error) { setAuthError(error.message); return; }
      setAuthInfo(t('auth.resetSent'));
    }
  };

  const handleChaosVoteChange = (voterId: string, targetId: string) => {
    setChaosVotes((prev) => ({ ...prev, [voterId]: targetId }));
  };

  const handleChaosSubmitVotes = () => {
    // Collect votes
    const activeAlivePlayers = players.filter((p) => p.isAlive && !p.isImprisoned);
    const voteCounts: Record<string, number> = {};
    activeAlivePlayers.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    Object.values(chaosVotes).forEach((votedId) => {
      const vid = votedId as string;
      if (vid && voteCounts[vid] !== undefined) {
        voteCounts[vid]++;
      }
    });

    let maxVotes = 0;
    let targetIds: string[] = [];

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        targetIds = [id];
      } else if (count === maxVotes && count > 0) {
        targetIds.push(id);
      }
    });

    let eliminatedId = '';
    let isTie = false;
    let tiedNames: string[] = [];

    if (targetIds.length > 0) {
      if (targetIds.length === 1) {
        eliminatedId = targetIds[0];
      } else {
        isTie = true;
        tiedNames = targetIds.map(id => players.find(p => p.id === id)?.name || tl('ناشناس', 'ناشناس'));
        // Randomly choose
        eliminatedId = targetIds[Math.floor(Math.random() * targetIds.length)];
      }

      setChaosModalData({
        isTie,
        tiedNames,
        eliminatedName: players.find(p => p.id === eliminatedId)?.name || tl('ناشناس', 'ناشناس'),
        eliminatedId
      });
    }
  };

  const handleApplyChaosResult = () => {
    const data = chaosModalData;
    if (!data) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === data.eliminatedId ? { ...p, isAlive: false } : p))
    );
    
    if (data.isTie) {
      handleLogEvent(tl(`💀 به دلیل تساوی آرا بین [${data.tiedNames.join('، ')}]، سیستم به طور تصادفی «${data.eliminatedName}» را هدف قرار داد و حذف کرد.`, `💀 to دلیل تساوی votes بین [${data.tiedNames.join('، ')}], سیستم randomly "${data.eliminatedName}" را target قرار داد and remove کرد.`), 'kill');
    } else {
      handleLogEvent(tl(`💀 بر اساس حداکثر آرای اجباری در فاز آشوب، «${data.eliminatedName}» هدف قرار گرفت و کشته شد.`, `💀 on اساس max آvote اجباری in phase chaos, "${data.eliminatedName}" target قرار گرفت and killed شد.`), 'kill');
    }

    setChaosModalData(null);

    // Wait a tick for gameover win check
    setTimeout(() => {
      if (!simulatedWinner && gamePhase === 'chaos') {
        const remainingActivePlayers = players.filter(p => p.id !== data.eliminatedId && p.isAlive && !p.isImprisoned);
        const shuffled = [...remainingActivePlayers].sort(() => Math.random() - 0.5).map(p => p.id);
        setChaosSpeakerOrder(shuffled);
        setChaosVotes({});
        handleLogEvent(tl(`نبرد آشوب ادامه دارد... رأی‌گیری مجدد آغار شد.`, `نبرد chaos continue has... voting مجدد آغار شد.`), 'system');
      }
    }, 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthEmail('');
    setAuthPassword('');
  };

  // Cabinet structure
  const [cabinet, setCabinet] = useState<Cabinet>(() => {
    const saved = localStorage.getItem('president_cabinet');
    if (!saved) {
      return {
        presidentId: null,
        vicePresidentId: null,
        mayorId: null,
        judgeId: null,
      };
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed) {
        return {
          presidentId: parsed.presidentId || null,
          vicePresidentId: parsed.vicePresidentId || null,
          mayorId: parsed.mayorId || null,
          judgeId: parsed.judgeId || null,
        };
      }
    } catch (e) {
      console.error('Error parsing president_cabinet from localStorage:', e);
    }
    return {
      presidentId: null,
      vicePresidentId: null,
      mayorId: null,
      judgeId: null,
    };
  });

  // UI Control states
  const [showSecrets, setShowSecrets] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_showSecrets');
    return saved ? saved === 'true' : false;
  });
  const [showRoleGuide, setShowRoleGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_showRoleGuide');
    return saved ? saved === 'true' : false;
  });
  const [showConditionsModal, setShowConditionsModal] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'day' | 'logs' | 'guide'>(() => {
    return (localStorage.getItem('president_selectedTab') as 'day' | 'logs' | 'guide') || 'day';
  });
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('president_customLogo') || null;
  });
  const [devPanelOpen, setDevPanelOpen] = useState<boolean>(false);
  const [simulatedWinner, setSimulatedWinner] = useState<'freemason' | 'citizen' | null>(null);
  const [executionMode, setExecutionMode] = useState<'STRICT' | 'CONTROLLED' | 'CREATIVE'>(() => {
    return (localStorage.getItem('president_execution_mode') as 'STRICT' | 'CONTROLLED' | 'CREATIVE') || 'STRICT';
  });

  // Day Active temporary states
  const [courtSelectedPlayers, setCourtSelectedPlayers] = useState<string[]>(() => {
    const saved = localStorage.getItem('president_courtSelectedPlayers');
    return saved ? JSON.parse(saved) : [];
  });
  const [courtExecutedToday, setCourtExecutedToday] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_courtExecutedToday');
    return saved ? saved === 'true' : false;
  });
  const [prisonerVerdictGivenToday, setPrisonerVerdictGivenToday] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_prisonerVerdictGivenToday');
    return saved ? saved === 'true' : false;
  });
  const [currentDayStep, setCurrentDayStep] = useState<number>(() => {
    const saved = localStorage.getItem('president_currentDayStep');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [popeVetoCooldown, setPopeVetoCooldown] = useState<number>(() => {
    const saved = localStorage.getItem('president_popeVetoCooldown');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [presidentSwappedToday, setPresidentSwappedToday] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_presidentSwappedToday');
    return saved ? saved === 'true' : false;
  });
  const [showModeratorGuide, setShowModeratorGuide] = useState(false);
  const [moderatorGuideScrollId, setModeratorGuideScrollId] = useState<string | undefined>(undefined);
  const [mayorRevoltedToday, setMayorRevoltedToday] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_mayorRevoltedToday');
    return saved ? saved === 'true' : false;
  });
  const [popeVetoedOnDay0, setPopeVetoedOnDay0] = useState<boolean>(() => {
    const saved = localStorage.getItem('president_popeVetoedOnDay0');
    return saved ? saved === 'true' : false;
  });
  const [selectedPresidentUnifiedRole, setSelectedPresidentUnifiedRole] = useState<string>('');
  const [resetConfirmActive, setResetConfirmActive] = useState<boolean>(false);
  const [logsConfirmActive, setLogsConfirmActive] = useState<boolean>(false);
  const [prisonCapacity, setPrisonCapacity] = useState<number>(() => {
    const saved = localStorage.getItem('president_prisonCapacity');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if (players.length > 0 && prisonCapacity === 0) {
      const cap = calculatePrisonCapacity(players.length);
      setPrisonCapacity(cap);
      localStorage.setItem('president_prisonCapacity', cap.toString());
    }
  }, [players, prisonCapacity]);

  const [rolesInPlay, setRolesInPlay] = useState<RoleType[]>(() => {
    let initialPlayersLength = 10;
    const savedPlayersStr = localStorage.getItem('president_players');
    if (savedPlayersStr) {
      try {
        const parsed = JSON.parse(savedPlayersStr);
        if (Array.isArray(parsed)) {
          initialPlayersLength = parsed.length;
        }
      } catch (e) {}
    }

    const mandatory: RoleType[] = ['president', 'mayor', 'judge', 'pope'];
    if (initialPlayersLength >= 10) {
      mandatory.push('vice_president');
    }
    const saved = localStorage.getItem('president_rolesInPlay');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing president_rolesInPlay from localStorage:', e);
      }
    }

    // Extract starting roles from saved players or defaults
    const savedPlayers = localStorage.getItem('president_players');
    let currentRoles: RoleType[] = [];
    if (savedPlayers) {
      try {
        const parsedPlayers = JSON.parse(savedPlayers);
        if (Array.isArray(parsedPlayers)) {
          currentRoles = parsedPlayers.map((p: any) => p?.role).filter((r?: RoleType) => r && r !== 'none');
        }
      } catch (e) {
        console.error('Error parsing president_players for rolesInPlay extraction:', e);
      }
    }

    return Array.from(new Set([...mandatory, ...currentRoles]));
  });

  useEffect(() => {
    localStorage.setItem('president_rolesInPlay', JSON.stringify(rolesInPlay));
  }, [rolesInPlay]);

  useEffect(() => {
    const currentRoles = players.map(p => p.role).filter(r => r !== 'none');
    if (currentRoles.length > 0) {
      setRolesInPlay(prev => {
        const next = Array.from(new Set([...prev, ...currentRoles]));
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          return next;
        }
        return prev;
      });
    }
  }, [players]);



  const [pendingPoliceTerrorists, setPendingPoliceTerrorists] = useState<number>(() => {
    const saved = localStorage.getItem('president_pendingPoliceTerrorists');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('president_pendingPoliceTerrorists', pendingPoliceTerrorists.toString());
  }, [pendingPoliceTerrorists]);

  const [revolutionToVeto, setRevolutionToVeto] = useState<{ presidentId: string; mayorId: string } | null>(() => {
    const saved = localStorage.getItem('president_revolutionToVeto');
    return saved ? JSON.parse(saved) : null;
  });
  const [courtExecutionToVeto, setCourtExecutionToVeto] = useState<string | null>(() => {
    return localStorage.getItem('president_courtExecutionToVeto') || null;
  });
  const [prisonerExecutionToVeto, setPrisonerExecutionToVeto] = useState<string | null>(() => {
    return localStorage.getItem('president_prisonerExecutionToVeto') || null;
  });
  
  // Timer for Lawyer Speech
  const [timerCount, setTimerCount] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Night outputs modal data
  const [nightResults, setNightResults] = useState<{
    deaths: string[];
    shieldBreaks: string[];
    courtNominees: string[];
    terroristsAdded: string[];
    terroristsUsed: string[];
    journalistReport: string | null;
    reporterReport: string | null;
  } | null>(() => {
    const saved = localStorage.getItem('president_nightResults');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed) {
        return {
          deaths: parsed.deaths || [],
          shieldBreaks: parsed.shieldBreaks || [],
          courtNominees: parsed.courtNominees || [],
          terroristsAdded: parsed.terroristsAdded || [],
          terroristsUsed: parsed.terroristsUsed || [],
          journalistReport: parsed.journalistReport || null,
          reporterReport: parsed.reporterReport || null,
        };
      }
    } catch (e) {
      console.error('Error parsing president_nightResults from localStorage:', e);
    }
    return null;
  });

  // Chaos phase states
  const [chaosVotes, setChaosVotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('president_chaosVotes');
    return saved ? JSON.parse(saved) : {};
  });
  const [chaosTiedPlayers, setChaosTiedPlayers] = useState<string[]>([]);
  const [chaosSpeakerOrder, setChaosSpeakerOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('president_chaosSpeakerOrder');
    return saved ? JSON.parse(saved) : [];
  });
  const [chaosModalData, setChaosModalData] = useState<{ isTie: boolean, tiedNames: string[], eliminatedName: string, eliminatedId: string } | null>(null);
  
  const [lastNightPriestBlockedId, setLastNightPriestBlockedId] = useState<string | null>(() => {
    return localStorage.getItem('president_lastNightPriestBlockedId') || null;
  });

  // SANITY CHECK: Ensure zero error rate for duplicate roles across the entire game
  useEffect(() => {
    if (players.length === 0) return;
    const rolesSeen = new Set<string>();
    let hasDuplicate = false;
    for (const p of players) {
      if (p.role !== 'none') {
        if (rolesSeen.has(p.role)) {
          hasDuplicate = true;
          break;
        }
        rolesSeen.add(p.role);
      }
    }
    
    if (hasDuplicate) {
      const activeRoles = new Set<string>();
      const sanitized = players.map(p => {
        if (p.role === 'none') return p;
        if (activeRoles.has(p.role)) {
          return { ...p, role: 'none' as RoleType, hasShield: false, shieldBroken: false };
        }
        activeRoles.add(p.role);
        return p;
      });
      setPlayers(sanitized);
    }
  }, [players]);

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('president_playerInput', playerInput);
  }, [playerInput]);

  useEffect(() => {
    localStorage.setItem('president_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('president_gamePhase', gamePhase);
  }, [gamePhase]);

  useEffect(() => {
    localStorage.setItem('president_cycleNumber', cycleNumber.toString());
  }, [cycleNumber]);

  useEffect(() => {
    localStorage.setItem('president_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('president_cabinet', JSON.stringify(cabinet));
  }, [cabinet]);

  useEffect(() => {
    localStorage.setItem('president_showSecrets', showSecrets.toString());
  }, [showSecrets]);

  useEffect(() => {
    localStorage.setItem('president_showRoleGuide', showRoleGuide.toString());
  }, [showRoleGuide]);

  useEffect(() => {
    localStorage.setItem('president_selectedTab', selectedTab);
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 'day' && gamePhase !== 'day') {
      setSelectedTab('logs');
    }
  }, [gamePhase, selectedTab]);

  useEffect(() => {
    localStorage.setItem('president_courtSelectedPlayers', JSON.stringify(courtSelectedPlayers));
  }, [courtSelectedPlayers]);

  useEffect(() => {
    localStorage.setItem('president_courtExecutedToday', courtExecutedToday.toString());
  }, [courtExecutedToday]);

  useEffect(() => {
    localStorage.setItem('president_prisonerVerdictGivenToday', prisonerVerdictGivenToday.toString());
  }, [prisonerVerdictGivenToday]);

  useEffect(() => {
    localStorage.setItem('president_currentDayStep', currentDayStep.toString());
  }, [currentDayStep]);

  useEffect(() => {
    localStorage.setItem('president_popeVetoCooldown', popeVetoCooldown.toString());
  }, [popeVetoCooldown]);

  useEffect(() => {
    localStorage.setItem('president_presidentSwappedToday', presidentSwappedToday.toString());
  }, [presidentSwappedToday]);

  useEffect(() => {
    localStorage.setItem('president_mayorRevoltedToday', mayorRevoltedToday.toString());
  }, [mayorRevoltedToday]);

  useEffect(() => {
    localStorage.setItem('president_popeVetoedOnDay0', popeVetoedOnDay0.toString());
  }, [popeVetoedOnDay0]);

  useEffect(() => {
    if (revolutionToVeto) {
      localStorage.setItem('president_revolutionToVeto', JSON.stringify(revolutionToVeto));
    } else {
      localStorage.removeItem('president_revolutionToVeto');
    }
  }, [revolutionToVeto]);

  useEffect(() => {
    if (courtExecutionToVeto) {
      localStorage.setItem('president_courtExecutionToVeto', courtExecutionToVeto);
    } else {
      localStorage.removeItem('president_courtExecutionToVeto');
    }
  }, [courtExecutionToVeto]);

  useEffect(() => {
    if (prisonerExecutionToVeto) {
      localStorage.setItem('president_prisonerExecutionToVeto', prisonerExecutionToVeto);
    } else {
      localStorage.removeItem('president_prisonerExecutionToVeto');
    }
  }, [prisonerExecutionToVeto]);

  useEffect(() => {
    if (nightResults) {
      localStorage.setItem('president_nightResults', JSON.stringify(nightResults));
    } else {
      localStorage.removeItem('president_nightResults');
    }
  }, [nightResults]);

  useEffect(() => {
    if (lastNightPriestBlockedId) {
      localStorage.setItem('president_lastNightPriestBlockedId', lastNightPriestBlockedId);
    } else {
      localStorage.removeItem('president_lastNightPriestBlockedId');
    }
  }, [lastNightPriestBlockedId]);

  useEffect(() => {
    localStorage.setItem('president_chaosVotes', JSON.stringify(chaosVotes));
  }, [chaosVotes]);

  useEffect(() => {
    localStorage.setItem('president_chaosSpeakerOrder', JSON.stringify(chaosSpeakerOrder));
  }, [chaosSpeakerOrder]);

  // Chaos Phase auto-trigger
  useEffect(() => {
    if (
      gamePhase !== 'chaos' &&
      gamePhase !== 'gameover' &&
      gamePhase !== 'setup' &&
      gamePhase !== 'day0' &&
      gamePhase !== 'night0' &&
      players.length > 0
    ) {
      const activeAlivePlayers = players.filter((p) => p.isAlive && !p.isImprisoned);
      const activeCount = activeAlivePlayers.length;
      const chaosThreshold = players.length <= 8 ? 4 : 5;
      
      if (activeCount <= chaosThreshold) {
        setGamePhase('chaos');
        
        // Randomly shuffle active players for speaking order
        const shuffled = [...activeAlivePlayers].sort(() => Math.random() - 0.5).map(p => p.id);
        setChaosSpeakerOrder(shuffled);
        setChaosVotes({});
        
        // All active players lose their roles, and imprisoned players are executed
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.isAlive && !p.isImprisoned) {
              return { ...p, role: 'none' };
            }
            if (p.isAlive && p.isImprisoned) {
              return { ...p, isAlive: false }; // Kill imprisoned players
            }
            return p;
          })
        );
        handleLogEvent(
          tl(`🚨 مجمع اضطراری آشوب دایر گردید! شمار بازماندگان فعال مجمع به لایحه اضطراریِ ${chaosThreshold} نفر رسید. زندانیان از بازی حذف و کلیه حقوق مدنی باطل شدند. فاز آشوب مستقر گردید!`, `🚨 assembly emergency chaos دایر گردید! شمار survivors active assembly to لایحه emergencyِ ${chaosThreshold} نفر رسید. prisoners from game remove and کلیه حقوق civil باطل شدند. phase chaos مستقر گردید!`),
          'system'
        );
      }
    }
  }, [players, gamePhase]);

  // President succession management effect
  useEffect(() => {
    if (gamePhase === 'setup' || gamePhase === 'gameover' || gamePhase === 'day0' || gamePhase === 'night0') return;

    const hasLivePresident = players.some((p) => p.role === 'president' && p.isAlive);
    const alivePlayersCount = players.filter((p) => p.isAlive).length;
    
    if (!hasLivePresident && alivePlayersCount > 0) {
      // Level 1: Vice president is alive
      const vp = players.find((p) => p.role === 'vice_president' && p.isAlive);
      if (vp) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === vp.id) {
              return { ...p, role: 'president', hasShield: true, shieldBroken: false };
            }
            return p;
          })
        );
        setCabinet((prev) => ({ ...prev, presidentId: vp.id, vicePresidentId: null }));
        handleLogEvent(
          tl(`🚨 جانشینی مقام ریاست جمهوری! با شهادت رئیس‌جمهور، معاون ایشان «${vp.name}» رسماً به عنوان رئیس‌جمهور جدید مجمع سوگند یاد کرد.`, `🚨 succession office presidency! with شهادت President, Vice President ایشان "${vp.name}" رسماً to عنوان President new assembly oath یاد کرد.`),
          'system'
        );
        return;
      }

      // Level 2: Mayor is alive
      const mayor = players.find((p) => p.role === 'mayor' && p.isAlive);
      if (mayor) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === mayor.id) {
              return { ...p, role: 'president', hasShield: true, shieldBroken: false };
            }
            return p;
          })
        );
        setCabinet((prev) => ({ ...prev, presidentId: mayor.id, mayorId: null }));
        handleLogEvent(
          tl(`🚨 جانشینی اضطراری ریاست جمهوری! با فوت رئیس‌جمهور و معاون مجمع، شهردار مقتدر «${mayor.name}» عهده‌دار کرسی ریاست جمهوری گردید.`, `🚨 succession emergency presidency! with death President and Vice President assembly, Mayor مقتدر "${mayor.name}" عهده‌دار کرسی presidency گردید.`),
          'system'
        );
        return;
      }

      // Level 5: Random assignment except judge, pope, priest, and imprisoned players
      const eligible = players.filter((p) => p.isAlive && !p.isImprisoned && p.role !== 'judge' && p.role !== 'pope' && p.role !== 'priest');
      if (eligible.length > 0) {
        const randomPlayer = eligible[Math.floor(Math.random() * eligible.length)];
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === randomPlayer.id) {
              return { ...p, role: 'president', hasShield: true, shieldBroken: false };
            }
            return p;
          })
        );
        setCabinet((prev) => ({ 
          ...prev, 
          presidentId: randomPlayer.id,
          vicePresidentId: prev.vicePresidentId === randomPlayer.id ? null : prev.vicePresidentId,
          mayorId: prev.mayorId === randomPlayer.id ? null : prev.mayorId,
          judgeId: prev.judgeId === randomPlayer.id ? null : prev.judgeId
        }));
        handleLogEvent(
          tl(`🚨 انتصاب اضطراری و تصادفی ریاست جمهوری! به علت فوت کادر ارشد مجمع، قرعه حاکمیت مجمع به صورت رندوم به نام بازیکن «${randomPlayer.name}» درآمد.`, `🚨 appointment emergency and random presidency! to علت death کادر ارشد assembly, قرعه sovereignty assembly to صورت رنtwoم to name player "${randomPlayer.name}" درآمد.`),
          'system'
        );
      } else {
        handleLogEvent(
          tl(`⚠️ فروپاشی حاکمیت اجرایی مجمع! کادر ارشد مجمع اعم از رئیس‌جمهور، معاون، شهردار تماماً مرده‌اند. به علت حفظ تفکیک قوا، امکان انتصاب پاپ، کشیش، قاضی یا زندانی در جایگاه ریاست‌جمهوری نیست. مجمع بدون قوه مجریه می‌ماند!`, `⚠️ فروپاشی sovereignty executive assembly! کادر ارشد assembly اعم from President, Vice President, Mayor تماماً dead‌اند. to علت حفظ تفکیک قوا, امکان appointment Pope, Priest, Judge or prisoner in position presidency نیست. assembly without قوه مجریه می‌ماند!`),
          'system'
        );
      }
    }
  }, [players, gamePhase]);

  // Pope automatic succession effect (Rule 7: Successor of Pope is priest)
  useEffect(() => {
    if (gamePhase === 'setup' || gamePhase === 'gameover' || gamePhase === 'day0' || gamePhase === 'night0') return;

    const hasLivePope = players.some((p) => p.role === 'pope' && p.isAlive);
    const priest = players.find((p) => p.role === 'priest' && p.isAlive);

    if (!hasLivePope && priest) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === priest.id) {
            return { ...p, role: 'pope', hasShield: true, shieldBroken: false }; // Pope receives initial shield
          }
          return p;
        })
      );
      handleLogEvent(
        tl(`🚨 جانشینی عالی پاپ اعظم! با فقدان پاپ اعظم، کشیشِ مجمع «${priest.name}» ردای سرخ پاپ اعظم را به دوش افکند.`, `🚨 succession عالی High Pope! with فقدان High Pope, Priestِ assembly "${priest.name}" ردای سرخ High Pope را to twoش افکند.`),
        'system'
      );
    }
  }, [players, gamePhase]);

  // Lawyer 60-second speech timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount((prev) => prev - 1);
      }, 1000);
      if (timerCount === 10 && timerRunning) {
        playTimerSound();
      }
    } else if (timerCount === 0) {
      setTimerRunning(false);
      playTimerSound();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerCount]);

  // Log Event helper
  const handleLogEvent = (
    message: string,
    type: 'info' | 'kill' | 'protect' | 'block' | 'ability' | 'vote' | 'system'
  ) => {
    const newLog: GameLog = {
      id: Math.random().toString(36).substring(2, 9),
      cycle: cycleNumber,
      phase: gamePhase === 'night' ? 'night' : 'day',
      message,
      type,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Helper for Dev Mode to skip/jump phases without filling forms
  const handleDevSetupAndJump = (targetPhase: GamePhase) => {
    let currentPlayers = [...players];
    if (currentPlayers.length === 0) {
      const defaultNames = [tl('مهرداد', 'Mehrdad'), tl('نیما', 'Nima'), tl('سپیده', 'Sepideh'), tl('آرمان', 'Arman'), tl('صبا', 'Saba'), tl('کیوان', 'Kayvan'), tl('بهار', 'Bahar'), tl('رامین', 'Ramin'), tl('رویا', 'Roya'), tl('سینا', 'Sina')];
      currentPlayers = initializePlayers(defaultNames);
    }

    // Role mappings and assignments
    const crucialRoles: RoleType[] = ['president', 'mayor', 'judge', 'pope'];
    if (currentPlayers.length >= 10) {
      crucialRoles.push('vice_president');
    }
    if (currentPlayers.length >= 10) {
      crucialRoles.push('priest');
    }

    crucialRoles.forEach((role) => {
      const alreadyHas = currentPlayers.some(p => p.role === role);
      if (!alreadyHas) {
        const candidate = currentPlayers.find(p => p.role === 'none') || currentPlayers.find(p => p.role !== 'president');
        if (candidate) {
          candidate.role = role;
          candidate.hasShield = hasInitialShield(role);
        }
      }
    });

    const otherRoles: RoleType[] = ['detective', 'doctor', 'reporter', 'journalist'];
    if (currentPlayers.length >= 12) {
      otherRoles.push('police');
    }
    if (currentPlayers.length > 8) {
      otherRoles.push('lawyer');
    }
    currentPlayers.forEach((p) => {
      if (p.role === 'none' && otherRoles.length > 0) {
        const nextRole = otherRoles.shift();
        if (nextRole) {
          p.role = nextRole;
          p.hasShield = hasInitialShield(nextRole);
        }
      }
    });

    if (targetPhase === 'chaos') {
      const activeAlivePlayers = currentPlayers.filter(p => p.isAlive && !p.isImprisoned);
      const shuffled = [...activeAlivePlayers].sort(() => Math.random() - 0.5).map(p => p.id);
      setChaosSpeakerOrder(shuffled);
      setChaosVotes({});
      
      currentPlayers = currentPlayers.map(p => {
        if (p.isAlive && !p.isImprisoned) {
          return { ...p, role: 'none' };
        }
        if (p.isAlive && p.isImprisoned) {
          return { ...p, isAlive: false };
        }
        return p;
      });
    }

    setPlayers(currentPlayers);
    setGamePhase(targetPhase);
    if (targetPhase === 'day' || targetPhase === 'chaos') {
      setSelectedTab('day');
    } else {
      setSelectedTab('logs');
    }
    setCycleNumber((prev) => (prev === 0 ? 1 : prev));

    const pres = currentPlayers.find((p) => p.role === 'president')?.id || null;
    const vice = currentPlayers.find((p) => p.role === 'vice_president')?.id || null;
    const mayor = currentPlayers.find((p) => p.role === 'mayor')?.id || null;
    const judge = currentPlayers.find((p) => p.role === 'judge')?.id || null;
    setCabinet({
      presidentId: pres,
      vicePresidentId: vice,
      mayorId: mayor,
      judgeId: judge,
    });

    handleLogEvent(`[توسعه] تغییر وضعیت با موفقیت انجام شد. فاز فعلی: ${
      targetPhase === 'setup' ? tl('ثبت‌نام', 'register') :
      targetPhase === 'day0' ? tl('روز صفر', 'Day Zero') :
      targetPhase === 'night0' ? tl('شب صفر', 'Night Zero') :
      targetPhase === 'day' ? tl('روز', 'day') :
      targetPhase === 'chaos' ? tl('آشوب', 'chaos') : tl('شب', 'night')
    }`, 'system');
  };

  // Helper selectors for dev panel to jump to specific sub-steps of day0 and night
  const handleJumpToDay0Step = (stepNum: number) => {
    if (gamePhase !== 'day0') {
      handleDevSetupAndJump('day0');
    }
    setTimeout(() => {
      if ((window as any).setDay0Step) {
        (window as any).setDay0Step(stepNum);
      }
    }, 50);
  };

  const handleJumpToNightStep = (stepNum: number) => {
    if (gamePhase !== 'night') {
      handleDevSetupAndJump('night');
    }
    setTimeout(() => {
      if ((window as any).setNightStep) {
        (window as any).setNightStep(stepNum);
      }
    }, 50);
  };

  // Sync cabinet positions whenever players role is changed
  useEffect(() => {
    const pres = players.find((p) => p.role === 'president' && p.isAlive)?.id || null;
    const vice = players.find((p) => p.role === 'vice_president' && p.isAlive)?.id || null;
    const mayor = players.find((p) => p.role === 'mayor' && p.isAlive)?.id || null;
    const judge = players.find((p) => p.role === 'judge' && p.isAlive)?.id || null;

    setCabinet({
      presidentId: pres,
      vicePresidentId: vice,
      mayorId: mayor,
      judgeId: judge,
    });
  }, [players]);

  // Game over checks
  const checkWinConditions = () => {
    if (simulatedWinner) return simulatedWinner;
    if (gamePhase === 'setup' || gamePhase === 'day0' || gamePhase === 'night0' || players.length === 0) return null;

    // Filter alive players that are NOT imprisoned (Imprisoned do NOT count towards victory!)
    const activeAlivePlayers = players.filter((p) => p.isAlive && !p.isImprisoned);
    const aliveMasons = activeAlivePlayers.filter((p) => p.identity === 'freemason');
    const aliveCitizens = activeAlivePlayers.filter((p) => p.identity === 'citizen');

    // Masons win: Masons count >= Citizens count
    if (aliveMasons.length >= aliveCitizens.length && aliveMasons.length > 0) {
      return 'freemason';
    }

    // Citizens win: All Masons are deceased or in prison
    const totalAliveMasonsUnimprisoned = players.filter(
      (p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned
    ).length;
    if (totalAliveMasonsUnimprisoned === 0) {
      return 'citizen';
    }

    return null;
  };

  const winStatus = checkWinConditions();

  // Reset function
  const handleResetGame = (force = false) => {
    if (force || !window.confirm || confirm(tl('آیا مایلید این بازی را ریست کرده و بازی جدیدی شروع کنید؟', 'آیا مایلید this game را reset کرده and new gameی start کنید?'))) {
      // Clear localStorage keys
      const keys = [
        'president_players',
        'president_gamePhase',
        'president_cycleNumber',
        'president_logs',
        'president_cabinet',
        'president_courtSelectedPlayers',
        'president_courtExecutedToday',
        'president_prisonerVerdictGivenToday',
        'president_currentDayStep',
        'president_popeVetoCooldown',
        'president_presidentSwappedToday',
        'president_mayorRevoltedToday',
        'president_nightResults',
        'president_popeVetoedOnDay0',
        'president_revolutionToVeto',
        'president_courtExecutionToVeto',
        'president_prisonerExecutionToVeto',
        'president_pendingPoliceTerrorists',
        'president_rolesInPlay',
        'president_lastNightPriestBlockedId',
        'president_chaosVotes',
        'president_chaosSpeakerOrder'
      ];
      keys.forEach((k) => localStorage.removeItem(k));

      setPlayers([]);
      setGamePhase('setup');
      setSelectedTab('guide');
      setCycleNumber(0);
      setLogs([]);
      setCabinet({ presidentId: null, vicePresidentId: null, mayorId: null, judgeId: null });
      setNightResults(null);
      setTimerRunning(false);
      setTimerCount(60);
      setCourtSelectedPlayers([]);
      setCourtExecutedToday(false);
      setPrisonerVerdictGivenToday(false);
      setCurrentDayStep(1);
      setPopeVetoCooldown(0);
      setPresidentSwappedToday(false);
      setMayorRevoltedToday(false);
      setPendingPoliceTerrorists(0);
      setPopeVetoedOnDay0(false);
      setRevolutionToVeto(null);
      setCourtExecutionToVeto(null);
      setPrisonerExecutionToVeto(null);
      setSimulatedWinner(null);
      setRolesInPlay([]);
      setLastNightPriestBlockedId(null);
      setChaosVotes({});
      setChaosSpeakerOrder([]);
      setChaosTiedPlayers([]);
      setChaosModalData(null);
    }
  };

  // Start the setup
  const handleStartSetup = () => {
    const names = playerInput
      .split(/[,،]/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length < 8) {
      alert(tl('بازی آقای رئیس‌جمهور حداقل نیاز به ۸ بازیکن دارد و برای تعداد کمتر مجمع رسمی تشکیل نمی‌شود.', 'game آقای President min نیاز to 8 player has and بvote count کمتر assembly رسمی تشکیل نمی‌شود.'));
      return;
    }
    if (names.length > 30) {
      alert(tl('تعداد بازیکنان مجمع حاکمیتی جهت پایداری و ثبات قوانین نباید بیش از ۳۰ نفر باشد.', 'count players governing assembly جهت stability and stability rules نmust بیش from 30 نفر باشد.'));
      return;
    }

    const assignedPlayers = initializePlayers(names);
    setPlayers(assignedPlayers);
    setGamePhase('day0');
    setSelectedTab('logs');
    setCycleNumber(1);
    setLogs([]);
    
    // Add logging
    const masonCount = calculateMasonCount(names.length);
    const customLogMsg = tl(`بازی با حضور ${names.length} بازیکن آغاز شد. ${masonCount} فراماسون (بر پایه حد نصاب قانونی ۲۹٪) به طور مخفیانه وارد لژ شدند.`, `game with presence ${names.length} player begin شد. ${masonCount} Freemason (on پایه حد نصاب ruleی 29٪) to طور hiddenانه وارد lodge شدند.`);
    
    // Explicit manual push
    const startLog: GameLog = {
      id: 'start-log',
      cycle: 1,
      phase: 'setup',
      message: customLogMsg,
      type: 'system',
      timestamp: new Date().toLocaleTimeString('fa-IR'),
    };
    setLogs([startLog]);
  };

  // Setup Complete - transition to Night 0
  const handleCompleteDay0 = (speakerId: string, popeVeto?: boolean) => {
    const isVetoed = popeVeto || false;
    setPopeVetoedOnDay0(isVetoed);

    // Equip appropriate roles with initial shields
    setPlayers((prev) => {
      let updated = prev.map((p) => ({
        ...p,
        hasShield: hasInitialShield(p.role),
      }));

      if (isVetoed) {
        // Find a random player to become a terrorist. Priority: non-role players, then role players.
        // We select from updated players who are alive and don't already have terrorist ability.
        const eligible = updated.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility);
        if (eligible.length > 0) {
          const roleless = eligible.filter((p) => p.role === 'none');
          const pool = roleless.length > 0 ? roleless : eligible;
          const chosen = pool[Math.floor(Math.random() * pool.length)];

          updated = updated.map((p) =>
            p.id === chosen.id ? { ...p, hasTerroristAbility: true, hasTerroristAbilityCycle: cycleNumber } : p
          );

          // Log the terrorist assignment
          setTimeout(() => {
            handleLogEvent(
              tl(`[وتوی پاپ اعظم] به واسطه حق ابطال تصمیمات مجمع توسط پاپ اعظم بر صندلی ریاست‌جمهوری، هسته‌های خشونت‌امیز فعال شدند! بازیکن «${chosen.name}» به صورت کاملاً پنهانی به عنوان «تروریست مجمع» انتصاب گردید.`, `[veto High Pope] to واسطه حق ابطال تصمیمات assembly توسط High Pope on seat presidency, هسته‌های خشونت‌امیز active شدند! player "${chosen.name}" to صورت fully covertly to عنوان "terrorist assembly" appointment گردید.`),
              'ability'
            );
          }, 100);
        }
      }
      return updated;
    });

    setGamePhase('night0');
    setSelectedTab('logs');
    handleLogEvent(
      `مجمع روز صفر تشکیل و کابینه منصوب شد. اینک وارد فاز «شب صفر» می‌شویم. فراماسون‌ها بیدار شده و ۳۰ ثانیه دیالوگ آغازین دارند.${
        isVetoed ? tl(' (توجه: حق وتوی پاپ اعظم فعال شده و تروریست مخفی گمارده شد)', '(note: حق veto High Pope active شده and terrorist hidden assigned شد)') : ''
      }`,
      'system'
    );
  };

  // Begin regular Day cycle
  const handleStartDay1 = () => {
    setGamePhase('day');
    setSelectedTab('day');
    handleLogEvent(tl(`شب صفر به پایان رسید. خرق فجر! وارد روز اول بازی می‌شویم. گفتگو آزاد آغاز می‌گردد.`, `Night Zero to end رسید. خرق فجر! وارد day اول game می‌شویم. discussion آزاد begin می‌گردد.`), 'system');
  };

  // Player action handlers
  const handleUpdatePlayerRole = (id: string, newRole: RoleType) => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    // Log the stripped role change if someone already has it
    if (newRole !== 'none') {
      const existingHolder = players.find(p => p.role === newRole && p.id !== id);
      if (existingHolder) {
        handleLogEvent(tl(`سمتِ «${ROLE_DETAILS[newRole].nameFa}» از بازیکن ${existingHolder.name} سلب شد.`, `سمتِ "${ROLE_DETAILS[newRole].nameFa}" from player ${existingHolder.name} سلب شد.`), 'system');
      }
    }

    setPlayers((prev) =>
      prev.map((p) => {
        // Strip the role from existing holder if they held this role
        if (newRole !== 'none' && p.role === newRole && p.id !== id) {
          return { ...p, role: 'none', hasShield: false, shieldBroken: false };
        }
        // Apply the new role to the target player
        if (p.id === id) {
          const needsShieldNow = hasInitialShield(newRole);
          return {
            ...p,
            role: newRole,
            // Automatically deactivate shield if role with shield is taken away
            hasShield: needsShieldNow,
            shieldBroken: !needsShieldNow ? false : p.shieldBroken,
          };
        }
        return p;
      })
    );

    handleLogEvent(tl(`جایگاه نقش بازیکن «${targetPlayer.name}» به «${ROLE_DETAILS[newRole].nameFa}» ارتقا یافت.`, `position role player "${targetPlayer.name}" to "${ROLE_DETAILS[newRole].nameFa}" ارتقا یافت.`), 'system');
  };

  const handleUpdatePlayerIdentity = (id: string, newIdentity: Identity) => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let masonNo = p.masonNumber;
          if (newIdentity === 'freemason' && p.identity !== 'freemason') {
            const maxMasonNo = Math.max(0, ...prev.map(pl => pl.masonNumber || 0));
            masonNo = maxMasonNo + 1;
          } else if (newIdentity === 'citizen') {
            masonNo = 0;
          }
          return {
            ...p,
            identity: newIdentity,
            masonNumber: masonNo,
          };
        }
        return p;
      })
    );

    const identityName = newIdentity === 'freemason' ? tl('فراماسون', 'Freemason') : tl('شهروند ساده', 'citizen plain');
    handleLogEvent(tl(`هویت اصلی بازیکن «${targetPlayer.name}» به «${identityName}» تغییر یافت.`, `identity اصلی player "${targetPlayer.name}" to "${identityName}" change یافت.`), 'system');
  };

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: generateId(),
      name: name,
      identity: 'citizen',
      masonNumber: 0,
      role: 'none',
      isAlive: true,
      isImprisoned: false,
      hasShield: false,
      shieldBroken: false,
      isBlocked: false,
      hasTerroristAbility: false,
      terroristUsed: false,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    handleLogEvent(tl(`بازیکن جدید «${name}» با موفقیت به بازی دعوت شد.`, `new player "${name}" with successfulیت to game دعوت شد.`), 'system');
  };

  const handleRemovePlayer = (id: string) => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;
    setPlayers((prev) => prev.filter(p => p.id !== id));
    handleLogEvent(tl(`بازیکن «${targetPlayer.name}» از مجمع بازی حذف شد.`, `player "${targetPlayer.name}" from open assemblyی remove شد.`), 'system');
  };

  const handleTogglePlayerAlive = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.isAlive;
          handleLogEvent(tl(`بازیکن «${p.name}» ${nextState ? tl('زنده شد و به جریان بازی بازگشت.', 'alive شد and to جریان game بازگشت.') : tl('مرد و به خاک سپرده شد.', 'مرد and to خاک shieldده شد.')}`, `player "${p.name}" ${nextState ? tl('زنده شد و به جریان بازی بازگشت.', 'alive شد and to جریان game بازگشت.') : tl('مرد و به خاک سپرده شد.', 'مرد and to خاک shieldده شد.')}`), nextState ? 'system' : 'kill');
          return { ...p, isAlive: nextState };
        }
        return p;
      })
    );
  };

  const handleTogglePlayerImprisoned = (id: string) => {
    const prisonerCount = players.filter((p) => p.isImprisoned && p.id !== id && p.isAlive).length;
    
    // Check prison limit of 3
    const target = players.find(p => p.id === id);
    if (!target) return;

    if (!target.isImprisoned && prisonerCount >= 3) {
      alert(tl('ظرفیت قانونی زندان قاضی حداکثر ۳ نفر است و هم‌اینک کاملاً پر می‌باشد!', 'ظرفیت ruleی prison Judge max 3 نفر است and هم‌اینک fully پر می‌باشد!'));
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.isImprisoned;
          handleLogEvent(
            tl(`بازیکن «${p.name}» توسط دادرسی قاضی ${nextState ? tl('به سلول انفرادی زندان منتقل و حق رای او تعلیق شد.', 'to cell solitary prison منتقل and حق vote او تعلیق شد.') : tl('از بند زندان آزاد شد.', 'from بند prison آزاد شد.')}`, `player "${p.name}" توسط دادرسی Judge ${nextState ? tl('به سلول انفرادی زندان منتقل و حق رای او تعلیق شد.', 'to cell solitary prison منتقل and حق vote او تعلیق شد.') : tl('از بند زندان آزاد شد.', 'from بند prison آزاد شد.')}`),
            'system'
          );
          if (nextState) {
            setCabinet((prevCab) => ({
              presidentId: prevCab.presidentId === id ? null : prevCab.presidentId,
              vicePresidentId: prevCab.vicePresidentId === id ? null : prevCab.vicePresidentId,
              mayorId: prevCab.mayorId === id ? null : prevCab.mayorId,
              judgeId: prevCab.judgeId === id ? null : prevCab.judgeId,
            }));
            return { ...p, isImprisoned: true, role: 'none', hasShield: false, shieldBroken: false, imprisonedAtCycle: cycleNumber, hasTerroristAbility: false, hasTerroristAbilityCycle: undefined };
          } else {
            return { ...p, isImprisoned: false };
          }
        }
        return p;
      })
    );
  };

  const handleTogglePlayerShield = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const hadActiveShield = p.hasShield && !p.shieldBroken;
          handleLogEvent(
            tl(`سپر امنیتی بازیکن «${p.name}» توسط گرداننده ${hadActiveShield ? tl('باطل شد.', 'باطل شد.') : tl('شارژ و فعال گردید.', 'شارژ and active گردید.')}`, `security shield player "${p.name}" توسط moderator ${hadActiveShield ? tl('باطل شد.', 'باطل شد.') : tl('شارژ و فعال گردید.', 'شارژ and active گردید.')}`),
            'protect'
          );
          return {
            ...p,
            hasShield: !hadActiveShield,
            shieldBroken: false,
          };
        }
        return p;
      })
    );
  };

  const handleTogglePlayerTerroristAbility = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.hasTerroristAbility;
          handleLogEvent(
            tl(`گرداننده قابلیت بمب تروریست را برای «${p.name}» ${nextState ? tl('فعال کرد.', 'active کرد.') : tl('غیر فعال نمود.', 'غیر active نمود.')}`, `moderator قابلیت bomb terrorist را بvote "${p.name}" ${nextState ? tl('فعال کرد.', 'active کرد.') : tl('غیر فعال نمود.', 'غیر active نمود.')}`),
            'ability'
          );
          return { ...p, hasTerroristAbility: nextState, hasTerroristAbilityCycle: nextState ? cycleNumber + 1 : undefined };
        }
        return p;
      })
    );
  };

  // --- CABINET DAY ACTIONS & HELPER CONTROLS ---

  // Identify players who are immune to court
  const isRestrictedFromCourt = (p: Player) => {
    return p.role === 'president' || p.role === 'pope' || p.role === 'judge';
  };

  // Helper to find all vacant cabinet/active roles in the game
  const getVacantRoles = () => {
    const aliveRoles = new Set(players.filter((p) => p.isAlive).map((p) => p.role));
    const vacant: RoleType[] = [];
    rolesInPlay.forEach((role) => {
      if (!aliveRoles.has(role as RoleType)) {
        vacant.push(role as RoleType);
      }
    });
    return vacant;
  };

  const canProceedFromPresidentStep = (showFeedback = false) => {
    if (currentDayStep > 4) {
      return true; // Past President's action phase
    }

    const presidentActive = cabinet.presidentId && players.find(p => p.id === cabinet.presidentId && p.isAlive);
    if (!presidentActive) {
      return true;
    }

    if (presidentSwappedToday) {
      return true;
    }

    const vacantRoles = getVacantRoles();
    if (vacantRoles.length === 0) {
      return true;
    }

    // Exception: If Judge role is vacant, it MUST be filled (mandatory under all circumstances)
    if (vacantRoles.includes('judge')) {
      if (showFeedback) {
        alert(tl('⚠️ نقش خالی قاضی تالار مجمع الزامی است! رئیس‌جمهور باید ابتدا جانشین قاضی مقتول را تعیین تکلیف کند.', '⚠️ role خالی Judge assembly hall mandatory است! President must ابتدا successor Judge killed را decide کند.'));
      }
      return false;
    }

    if (vacantRoles.includes('mayor')) {
      if (showFeedback) {
        alert(tl('⚠️ نقش خالی شهردار الزامی است! رئیس‌جمهور باید جانشین شهردار را تعیین تکلیف کند.', '⚠️ role خالی Mayor mandatory است! President must successor Mayor را decide کند.'));
      }
      return false;
    }

    // Checking if there's any alive player with role 'none' who can take the empty roles
    const hasRoleless = players.some(p => p.isAlive && p.role === 'none');
    if (hasRoleless) {
      // Priest and Pope roles are excluded because the President cannot configure them, and the Pope's assignment is optional.
      const mandatoryVacant = vacantRoles.filter(r => r !== 'priest' && r !== 'pope');
      if (mandatoryVacant.length > 0) {
        if (showFeedback) {
          alert(tl('⚠️ رئیس‌جمهور موظف است نقش‌های خالی مجمع را با شهروندان بدون نقش جایگزین کند. لطفاً ابتدا نقش یا نقش‌های خالی را واگذار بفرمایید.', '⚠️ President موظف است roles خالی assembly را with citizens without role جایگزین کند. Please ابتدا role or roles خالی را واگذار بفرمایید.'));
        }
        return false;
      }
    }

    return true;
  };

  // Pope Assign New Priest upon Priest's death (Rule 4)
  const handlePopeAssignNewPriest = (newPriestId: string) => {
    const nominee = players.find((p) => p.id === newPriestId);
    if (!nominee || !nominee.isAlive) {
      alert(tl('لطفاً یک بازیکن زنده را به عنوان کشیش جدید انتخاب فرمایید.', 'Please a player alive را to عنوان Priest new select فرمایید.'));
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        // Clear dead priest's role to maintain unique assignments
        if (p.role === 'priest' && p.id !== newPriestId) {
          return { ...p, role: 'none', hasShield: false };
        }
        if (p.id === newPriestId) {
          return { ...p, role: 'priest', hasShield: false };
        }
        return p;
      })
    );

    handleLogEvent(
      tl(`پاپ مقتدر با صدور فرمان معنوی، بازیکن زنده «${nominee.name}» را به مقام کشیش جدید مجمع منصوب فرمود.`, `Pope مقتدر with issue order معنوی, player alive "${nominee.name}" را to office Priest new assembly appointed فرمود.`),
      'system'
    );
  };

  // President Assign New Pope when both are dead (Rule 5)
  const handlePresidentAssignNewPope = (newPopeId: string) => {
    const nominee = players.find((p) => p.id === newPopeId);
    if (!nominee || !nominee.isAlive) {
      alert(tl('لطفاً یک بازیکن زنده جهت جانشینی مقام پاپ انتخاب نمایید.', 'Please a player alive جهت succession office Pope select نمایید.'));
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        // Reset old dead popes/priests roles to none representation
        if (p.role === 'pope' && p.id !== newPopeId) {
          return { ...p, role: 'none', hasShield: false };
        }
        if (p.id === newPopeId) {
          return { ...p, role: 'pope', hasShield: true, shieldBroken: false }; // Pope receives initial shield
        }
        return p;
      })
    );

    handleLogEvent(
      tl(`به دلیل فوت همزمان پاپ و کشیش، رئیس‌جمهور مجمع بازیکن زنده «${nominee.name}» را به مقام پاپ اعظم منصوب نمود.`, `to دلیل death همزمان Pope and Priest, President open assemblyیکن alive "${nominee.name}" را to office High Pope appointed نمود.`),
      'system'
    );
  };

  const handleManualAssignPresident = (newPresidentId: string, assignerName: string) => {
    const nominee = players.find(p => p.id === newPresidentId);
    if (!nominee || !nominee.isAlive) {
      alert(tl('لطفاً یک بازیکن زنده برگزینید.', 'Please a player alive choose.'));
      return;
    }
    
    setPlayers(prev => prev.map(p => {
      if (p.id === newPresidentId) {
        return { ...p, role: 'president', hasShield: true, shieldBroken: false };
      }
      return p;
    }));
    setCabinet(prev => ({ 
      ...prev, 
      presidentId: newPresidentId,
      vicePresidentId: prev.vicePresidentId === newPresidentId ? null : prev.vicePresidentId,
      mayorId: prev.mayorId === newPresidentId ? null : prev.mayorId,
      judgeId: prev.judgeId === newPresidentId ? null : prev.judgeId
    }));
    handleLogEvent(tl(`🚨 تعیین ریاست جمهوری جدید! با غیاب رئیس‌جمهور و فوت معاونان، به فرمان عالیِ ${assignerName}، بازیکن زنده «${nominee.name}» به کرسی ریاست منصوب شد.`, `🚨 set presidency new! with غیاب President and death Vice Presidentان, to order عالیِ ${assignerName}, player alive "${nominee.name}" to کرسی ریاست appointed شد.`), 'system');
  };

  // President Fill Vacant Role (Rule 3 priority and Vacant Judge Priority)
  const handlePresidentFillVacantRole = (pId: string, role: RoleType) => {
    if (presidentSwappedToday) {
      const vacantRoles = getVacantRoles();
      if (!vacantRoles.includes(role)) {
        alert(tl('رئیس‌جمهور قبلاً قابلیت جابه‌جایی/پر کردن نقش‌های خود را در این فاز روز خرج کرده است.', 'President قبلاً قابلیت swap/پر کردن roles خود را in this day phase خرج کرده است.'));
        return;
      }
    }
    const valPlayer = players.find((p) => p.id === pId);
    if (!valPlayer || !valPlayer.isAlive) {
      alert(tl('لطفاً یک بازیکن زنده برگزینید.', 'Please a player alive choose.'));
      return;
    }

    const vacantRoles = getVacantRoles();
    if (!vacantRoles.includes(role)) {
      alert(tl('این نقش هم‌اکنون خالی نیست یا در بازی وجود ندارد.', 'this role هم‌اکنون خالی نیست or in game exists lacks.'));
      return;
    }

    const oldRoleOfPlayer = valPlayer.role;

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === pId) {
          const needsShieldNow = hasInitialShield(role);
          return {
            ...p,
            role: role,
            hasShield: needsShieldNow,
            shieldBroken: !needsShieldNow ? false : p.shieldBroken,
          };
        }
        // Free old dead role holder
        if (p.role === role && p.id !== pId) {
          return { ...p, role: 'none', hasShield: false, shieldBroken: false };
        }
        return p;
      })
    );

    setPresidentSwappedToday(true);
    const oldRoleMsg = oldRoleOfPlayer !== 'none' ? tl(`دارای منصب والای «${ROLE_DETAILS[oldRoleOfPlayer].nameFa}»`, `داvote منصب والای "${ROLE_DETAILS[oldRoleOfPlayer].nameFa}"`) : tl('بدون منصب', 'without منصب');
    handleLogEvent(
      tl(`رئیس‌جمهور نقش خالیِ «${ROLE_DETAILS[role].nameFa}» را به شهروند زنده ${oldRoleMsg} به نام «${valPlayer.name}» تفویض نمود.`, `President role خالیِ "${ROLE_DETAILS[role].nameFa}" را to citizen alive ${oldRoleMsg} to name "${valPlayer.name}" تفویض نمود.`),
      'ability'
    );
  };

  // President role Swap
  const handlePresidentSwapRoles = (p1Id: string, p2Id: string) => {
    if (presidentSwappedToday) {
      alert(tl('رئیس‌جمهور قبلاً قابلیت جابه‌جایی نقش‌های خود را در این فاز روز خرج کرده است.', 'President قبلاً قابلیت swap roles خود را in this day phase خرج کرده است.'));
      return;
    }

    const p1 = players.find((p) => p.id === p1Id);
    const p2 = players.find((p) => p.id === p2Id);

    if (!p1 || !p2 || p1Id === p2Id) {
      alert(tl('لطفاً دو بازیکن متمایز را جهت تعویض نقش برگزینید.', 'Please two player متمایز را جهت swap role choose.'));
      return;
    }

    const r1 = p1.role;
    const r2 = p2.role;

    // We do not swap the president's own role!
    if (r1 === 'president' || r2 === 'president') {
      alert(tl('رئیس‌جمهور نمی‌تواند نقش خودش را با شخص دیگری جایگزین کند.', 'President cannot role خودش را with شخص دیگری جایگزین کند.'));
      return;
    }

    const vacantRolesInSwap = getVacantRoles().filter(r => r !== 'priest' && r !== 'pope');

    // Role 2 and roleless priorities (Rule 2 and Rule 3)
    if (r1 === 'pope' || r2 === 'pope' || r1 === 'priest' || r2 === 'priest') {
      alert(tl('رئیس‌جمهور مجاز به تغییر یا تعویض نقش‌های مقدس پاپ و کشیش نمی‌باشد.', 'President مجاز to change or swap roles مقدس Pope and Priest نمی‌باشد.'));
      return;
    }

    if (vacantRolesInSwap.length > 0) {
      alert(
        `خطای حاکمیتی: ابتدا باید نقش‌های بدون متصدی بازی (${vacantRolesInSwap
          .map((r) => ROLE_DETAILS[r].nameFa)
          .join('، ')}) توسط رئیس‌جمهور جایگزین و پر شوند تا امکان تبادل نقش‌های فعال میسر گردد.`
      );
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === p1Id) {
          const needsShield = hasInitialShield(r2);
          return {
            ...p,
            role: r2,
            hasShield: needsShield,
            shieldBroken: !needsShield ? false : p.shieldBroken,
          };
        }
        if (p.id === p2Id) {
          const needsShield = hasInitialShield(r1);
          return {
            ...p,
            role: r1,
            hasShield: needsShield,
            shieldBroken: !needsShield ? false : p.shieldBroken,
          };
        }
        return p;
      })
    );

    setPresidentSwappedToday(true);
    handleLogEvent(
      tl(`ریاست جمهوری فرمان عالی جابه‌جایی را امضا کرد: نقش‌های «${p1.name}» (${ROLE_DETAILS[r1].nameFa}) و «${p2.name}» (${ROLE_DETAILS[r2].nameFa}) با یکدیگر معاوضه گشتند.`, `presidency order عالی swap را امضا کرد: roles "${p1.name}" (${ROLE_DETAILS[r1].nameFa}) and "${p2.name}" (${ROLE_DETAILS[r2].nameFa}) with یکدیگر معاوضه گشتند.`),
      'ability'
    );
  };

  // Helper to add random terrorist when Pope interferes
  const addRandomTerroristOnVeto = () => {
    let eligible = players.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility);
    if (eligible.length > 0) {
      const roleless = eligible.filter((p) => p.role === 'none');
      const pool = roleless.length > 0 ? roleless : eligible;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      setPlayers((prev) =>
        prev.map((p) => (p.id === chosen.id ? { ...p, hasTerroristAbility: true, hasTerroristAbilityCycle: cycleNumber + 1 } : p))
      );
      handleLogEvent(tl(`به جهت ابطال تصمیمات قانونی مجمع توسط پاپ مصلح، قابلیت تروریست تصادفی جدید به بازیکن «${chosen.name}» اهدا شد.`, `to جهت ابطال تصمیمات ruleی assembly توسط Pope مصلح, قابلیت terrorist random new to player "${chosen.name}" اهدا شد.`), 'ability');
    }
  };

  const handleVetoRevolution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert(tl('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.', 'veto Pope only from day اول to بعد in phase discussion active است.'));
      return;
    }
    if (popeVetoCooldown > 0) {
      alert(tl('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.', 'veto Pope in roundه خنک‌سازی (a day in میان) to سر می‌برد.'));
      return;
    }
    if (!revolutionToVeto) {
      alert(tl('هیچ انقلاب موفقی امروز رخ نداده است تا وتو شود.', 'no revolution successfulی امday رخ نداده است until veto شود.'));
      return;
    }

    const { presidentId, mayorId } = revolutionToVeto;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === presidentId) {
          return { ...p, role: 'president', hasShield: true, shieldBroken: false };
        }
        if (p.id === mayorId) {
          return { ...p, role: 'mayor', hasShield: false };
        }
        return p;
      })
    );

    handleLogEvent(
      tl(`کلیسای پاپ دخالت کرد! پاپ اعظم مجمع لایحه انقلاب شهردار را باطل اعلام نمود. مقام رئیس‌جمهور و شهردار به جایگاه پیشین خود بازگشتند.`, `کلیسای Pope دخالت کرد! High Pope assembly لایحه Mayor revolution را باطل اعلام نمود. office President and Mayor to position پیشین خود بازگشتند.`),
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setRevolutionToVeto(null);
  };

  const handleVetoCourtExecution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert(tl('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.', 'veto Pope only from day اول to بعد in phase discussion active است.'));
      return;
    }
    if (popeVetoCooldown > 0) {
      alert(tl('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.', 'veto Pope in roundه خنک‌سازی (a day in میان) to سر می‌برد.'));
      return;
    }
    if (!courtExecutionToVeto) {
      alert(tl('هیچ رای اعدام دادگاهی امروز صادر نشده است تا وتو شود.', 'no vote execution courtی امday issued نشده است until veto شود.'));
      return;
    }

    const target = players.find((p) => p.id === courtExecutionToVeto);
    if (!target) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === courtExecutionToVeto ? { ...p, isAlive: true } : p))
    );

    handleLogEvent(
      tl(`کلیسای پاپ دخالت کرد! حکم اعدام اعلام شده قاضی دادگاه برای بازیکن «${target.name}» توسط پاپ اعظم ابطال و متهم بخشیده شد.`, `کلیسای Pope دخالت کرد! verdict execution اعلام شده Judge court بvote player "${target.name}" توسط High Pope ابطال and defendant بخشیده شد.`),
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setCourtExecutionToVeto(null);
  };

  const handleVetoPrisonerExecution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert(tl('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.', 'veto Pope only from day اول to بعد in phase discussion active است.'));
      return;
    }
    if (popeVetoCooldown > 0) {
      alert(tl('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.', 'veto Pope in roundه خنک‌سازی (a day in میان) to سر می‌برد.'));
      return;
    }
    if (!prisonerExecutionToVeto) {
      alert(tl('هیچ رای اعدام زندانی امروز صادر نشده است تا وتو شود.', 'no vote execution prisoner امday issued نشده است until veto شود.'));
      return;
    }

    const target = players.find((p) => p.id === prisonerExecutionToVeto);
    if (!target) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === prisonerExecutionToVeto ? { ...p, isAlive: true, isImprisoned: true } : p))
    );

    handleLogEvent(
      tl(`کلیسای پاپ دخالت کرد! حکم اعدام زندانیِ بندِ تالار «${target.name}» توسط پاپ اعظم ابطال گردید و ایشان در سلول زنده باقی ماند.`, `کلیسای Pope دخالت کرد! verdict execution prisonerِ بندِ hall "${target.name}" توسط High Pope ابطال گردید and ایشان in cell alive باقی ماند.`),
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setPrisonerExecutionToVeto(null);
  };

  // Mayor Revolution
  const handleMayorRevolution = (success: boolean) => {
    if (mayorRevoltedToday) {
      alert(tl('شهردار قبلاً در این دوره درخواست ائتلاف یا کودتا داده است.', 'Mayor قبلاً in this roundه درخواست ائتلاف or coup داده است.'));
      return;
    }

    const president = players.find((p) => p.role === 'president');
    const mayor = players.find((p) => p.role === 'mayor');

    if (!president || !mayor) {
      alert(tl('رئیس‌جمهور یا شهردار در حیات قانونی نیستند تا مجمع انقلاب شکل گیرد.', 'President or Mayor in حیات ruleی نیستند until assembly revolution شکل گیرد.'));
      return;
    }

    setMayorRevoltedToday(true);

    if (success) {
      // Mayor becomes President's successor/new President
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.role === 'president') {
            return { ...p, role: 'none', hasShield: false }; // Deposed president loses role
          }
          if (p.role === 'mayor') {
            return { ...p, role: 'president', hasShield: true, shieldBroken: false }; // Mayor is now president
          }
          return p;
        })
      );
      if (!courtSelectedPlayers.includes(president.id)) {
        setCourtSelectedPlayers((prev) => [...prev, president.id]);
      }
      handleLogEvent(
        tl(`کودتای بهار! شهردار «${mayor.name}» با موفقیت رئیس‌جمهور «${president.name}» را خلع کرد و رئیس‌جمهور جدید شد. رئیس سابق خلع سلاح گردید و به عنوان متهم به دادگاه معرفی شد!`, `coupی Bahar! Mayor "${mayor.name}" with successfulیت President "${president.name}" را خلع کرد and President new شد. رئیس سابق خلع سلاح گردید and to عنوان defendant to court معرفی شد!`),
        'ability'
      );
    } else {
      // Failed revolution - Mayor loses role and is set to court entry!
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.role === 'mayor') {
            return { ...p, role: 'none', hasShield: false };
          }
          return p;
        })
      );
      if (!courtSelectedPlayers.includes(mayor.id)) {
        setCourtSelectedPlayers((prev) => [...prev, mayor.id]);
      }
      handleLogEvent(
        tl(`انقلاب شهرداری شکست خورد! بازیکن «${mayor.name}» لایسنس شهرداری را از دست داد و به تالار متهمین دادگاه (ورودی دادگاه) معرفی شد.`, `Mayor revolution شکست خورد! player "${mayor.name}" لایسنس Mayorی را from دست داد and to hall defendantین court (enterی court) معرفی شد.`),
        'system'
      );
    }

    // Add random terrorist
    let eligible = players.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility);
    if (eligible.length > 0) {
      const roleless = eligible.filter((p) => p.role === 'none');
      const pool = roleless.length > 0 ? roleless : eligible;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      setPlayers((prev) =>
        prev.map((p) => (p.id === chosen.id ? { ...p, hasTerroristAbility: true, hasTerroristAbilityCycle: cycleNumber + 1 } : p))
      );
      handleLogEvent(tl(`به سبب هرج‌ومرج ناشی از انقلاب در مجمع، بمب و توانایی تروریست تصادفی جدید به بازیکن «${chosen.name}» منتقل شد.`, `to سبب هرج‌ومرج ناشی from revolution in assembly, bomb and توانایی terrorist random new to player "${chosen.name}" منتقل شد.`), 'ability');
    }
  };

  // Execute verdict on an already imprisoned player (pardon or execute) - Rule 9
  const handleExecutePrisonerVerdict = (targetId: string, verdict: 'pardon' | 'execute') => {
    if (prisonerVerdictGivenToday) {
      alert(tl('قاضی امروز پیش‌تر یک حکم (اعدام یا عفو) برای زندانی‌ها صادر کرده است. هر روز فقط یک حکم برای زندان قابل صدور است.', 'Judge امday پیش‌تر a verdict (execution or pardon) بvote prisoner‌ها issued کرده است. each day only a verdict بvote prison قابل issue است.'));
      return;
    }

    const target = players.find((p) => p.id === targetId);
    if (!target || !target.isImprisoned) return;

    if (target.imprisonedAtCycle === cycleNumber) {
      alert(tl('این شخص به تازگی (همین امروز) به زندان افتاده است و نمی‌توان امروز برای او حکمی صادر کرد.', 'this شخص to تازگی (همین امday) to prison افتاده است and نcan امday بvote او verdictی issued کرد.'));
      return;
    }

    setPrisonerVerdictGivenToday(true);

    if (verdict === 'pardon') {
      setPlayers((prev) => prev.map((p) => (p.id === targetId ? { ...p, isImprisoned: false } : p)));
      handleLogEvent(tl(`فرمان عفو قاضی! زندانیِ بندِ تالار «${target.name}» مورد عفو واقع شد و آزاد گردید.`, `order pardon Judge! prisonerِ بندِ hall "${target.name}" item pardon واقع شد and آزاد گردید.`), 'system');
    } else if (verdict === 'execute') {
      setPlayers((prev) => prev.map((p) => (p.id === targetId ? { ...p, isAlive: false, isImprisoned: false } : p)));
      setPrisonerExecutionToVeto(targetId);
      handleLogEvent(tl(`اعدام انقلابی در بند! حکم مرگ قطعی زندانیِ غائب «${target.name}» صادر گردید و گیوتین فرود آمد.`, `execution revolutionی in بند! verdict death قطعی prisonerِ غائب "${target.name}" issued گردید and گیوتین فرود آمد.`), 'kill');
    }
  };

  // Collective pardon for court nominees
  const handlePardonAllNominees = () => {
    courtSelectedPlayers.forEach((id) => {
      const p = players.find((x) => x.id === id);
      if (p) {
        handleLogEvent(tl(`فرمان عفو دسته‌جمعی قاضی! متهم مجمع «${p.name}» با موفقیت بخشیده شد.`, `order pardon دسته‌جمعی Judge! defendant assembly "${p.name}" with successfulیت بخشیده شد.`), 'system');
      }
    });
    setCourtSelectedPlayers([]);
  };

  // Judge Verdict execution
  const handleExecuteVerdict = (verdict: 'pardon' | 'jail' | 'execute', targetId: string) => {
    const target = players.find((p) => p.id === targetId);
    if (!target) return;

    if (verdict === 'pardon') {
      handleLogEvent(tl(`قاضی دادگاه حکم تبرئه تام‌الاختیار بازیکن «${target.name}» را صادر کرد.`, `Judge court verdict تبرئه تام‌الauthority player "${target.name}" را issued کرد.`), 'system');
      // Remove only this person from nominees
      setCourtSelectedPlayers((prev) => prev.filter((id) => id !== targetId));
    } else if (verdict === 'jail') {
      const currentPrisCount = players.filter((p) => p.isImprisoned && p.id !== targetId && p.isAlive).length;
      if (currentPrisCount >= prisonCapacity) {
        alert(tl(`امکان زندانی کردن متهم وجود ندارد! ظرفیت سلول زندان قاضی (${prisonCapacity} نفر) کاملاً تکمیله.`, `امکان prisoner کردن defendant exists lacks! ظرفیت cell prison Judge (${prisonCapacity} نفر) fully تکمیله.`));
        return;
      }
      setPlayers((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, isImprisoned: true, role: 'none', hasShield: false, shieldBroken: false, imprisonedAtCycle: cycleNumber, hasTerroristAbility: false, hasTerroristAbilityCycle: undefined } : p))
      );
      setCabinet((prev) => ({
        presidentId: prev.presidentId === targetId ? null : prev.presidentId,
        vicePresidentId: prev.vicePresidentId === targetId ? null : prev.vicePresidentId,
        mayorId: prev.mayorId === targetId ? null : prev.mayorId,
        judgeId: prev.judgeId === targetId ? null : prev.judgeId,
      }));
      setCourtExecutedToday(true);
      handleLogEvent(tl(`محکمه زندان! قاضی، بازیکن «${target.name}» را راهی بند صغیر زندان کشید و سمت او منحل گشت.`, `مverdictه prison! Judge, player "${target.name}" را راهی بند صغیر prison کشید and سمت او منحل گشت.`), 'system');

      // Auto-pardon alternative nominee (only one person can get sentenced!)
      const others = courtSelectedPlayers.filter((id) => id !== targetId);
      others.forEach((id) => {
        const p = players.find((x) => x.id === id);
        if (p) {
          handleLogEvent(tl(`به جهت صدور حکم بر متهم دیگر، بازیکن «${p.name}» مشمول عفو مستمر گردید و آزاد شد.`, `to جهت issue verdict on defendant دیگر, player "${p.name}" مشمول pardon مستمر گردید and آزاد شد.`), 'system');
        }
      });
      setCourtSelectedPlayers([]);
    } else if (verdict === 'execute') {
      setPlayers((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, isAlive: false } : p))
      );
      setCourtExecutionToVeto(targetId);
      setCourtExecutedToday(true);
      handleLogEvent(tl(`حکم اعدام! گیوتین بر گلوی بازیکن «${target.name}» فرود آمد.`, `verdict execution! گیوتین on گلوی player "${target.name}" فرود آمد.`), 'kill');

      // Auto-pardon alternative nominee
      const others = courtSelectedPlayers.filter((id) => id !== targetId);
      others.forEach((id) => {
        const p = players.find((x) => x.id === id);
        if (p) {
          handleLogEvent(tl(`به جهت صدور حکم بر متهم دیگر، بازیکن «${p.name}» مشمول عفو مستمر گردید و آزاد شد.`, `to جهت issue verdict on defendant دیگر, player "${p.name}" مشمول pardon مستمر گردید and آزاد شد.`), 'system');
        }
      });
      setCourtSelectedPlayers([]);
    }
  };

  // Cycle Phase transition - BEGIN NIGHT
  const handleBeginNight = () => {
    if (!canProceedFromPresidentStep(true)) {
      return;
    }
    
    let nextPending = pendingPoliceTerrorists;
    const newlyAssignedTerrorists: string[] = [];
    
    if (nextPending > 0) {
      // Create a fresh eligible array ignoring pending terrorists and players already dead
      let eligible = players.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility && !(p.hasTerroristAbilityCycle !== undefined && cycleNumber >= p.hasTerroristAbilityCycle));
      
      while (nextPending > 0 && eligible.length > 0) {
        const roleless = eligible.filter((p) => p.role === 'none');
        const pool = roleless.length > 0 ? roleless : eligible;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        
        newlyAssignedTerrorists.push(chosen.id);
        eligible = eligible.filter(p => p.id !== chosen.id);
        nextPending--;
      }
      setPendingPoliceTerrorists(nextPending);
    }

    // Reset temporary states & handle terrorist expiry/generation
    setPlayers((prev) => prev.map((p) => {
      let hasTerroristAbility = p.hasTerroristAbility;
      let hasTerroristAbilityCycle = p.hasTerroristAbilityCycle;
      
      // Expire old terrorists who didn't act:
      // If the current day equals or exceeds their valid explosion cycle, it expires heading into this night
      if (hasTerroristAbility && hasTerroristAbilityCycle !== undefined && cycleNumber >= hasTerroristAbilityCycle) {
        hasTerroristAbility = false;
        hasTerroristAbilityCycle = undefined;
        setTimeout(() => {
          handleLogEvent(tl(`زمان استفاده از بمب به پایان رسید؛ قابلیت انتحاری تروریست برای «${p.name}» ابطال و ملغا گردید.`, `زمان استفاده from bomb to end رسید; قابلیت suicide terrorist بvote "${p.name}" ابطال and ملغا گردید.`), 'system');
        }, 50);
      }
      
      // Assign new police terrorist abilities that span tonight and tomorrow
      if (newlyAssignedTerrorists.includes(p.id)) {
        hasTerroristAbility = true;
        hasTerroristAbilityCycle = cycleNumber + 1;
        setTimeout(() => {
          handleLogEvent(tl(`به واسطه خشونت و آثار شلیک پلیس در شب گذشته، قابلیت تروریست (با مهلت امشب و فردا روز) مخفیانه به بازیکن «${p.name}» منتقل گردید.`, `to واسطه خشونت and آثار shot Police in night گذشته, قابلیت terrorist (with مهلت امnight and فردا day) hiddenانه to player "${p.name}" منتقل گردید.`), 'ability');
        }, 150);
      }
      
      return { ...p, isBlocked: false, hasTerroristAbility, hasTerroristAbilityCycle };
    }));
    setPresidentSwappedToday(false);
    setMayorRevoltedToday(false);
    setCourtExecutedToday(false);
    setPrisonerVerdictGivenToday(false);
    setCurrentDayStep(1);
    setRevolutionToVeto(null);
    setCourtExecutionToVeto(null);
    setPrisonerExecutionToVeto(null);
    
    // Cool down the pope's veto power
    if (popeVetoCooldown > 0) {
      setPopeVetoCooldown((prev) => prev - 1);
    }

    setGamePhase('night');
    setSelectedTab('logs');
    handleLogEvent(tl(`آفتاب غروب کرد! فاز گفتگو بسته شد و مأموریت خطیر شبانه دور ${cycleNumber} آغاز می‌شود.`, `آفتاب غروب کرد! phase discussion بسته شد and مأموریت خطیر nightانه round ${cycleNumber} begin می‌شود.`), 'system');
  };

  // Complete Night actions - compile results
  const handleCompleteNightWizard = (results: {
    deaths: string[];
    shieldBreaks: string[];
    courtNominees: string[];
    terroristsAdded: string[];
    terroristsUsed: string[];
    journalistReport: string | null;
    reporterReport: string | null;
    policeShotOccurred: boolean;
    priestBlockedId: string | null;
  }) => {
    const nextCycle = cycleNumber + 1;
    let updatedTerroristsAdded = [...results.terroristsAdded];
    let nextPending = pendingPoliceTerrorists;

    if (results.priestBlockedId) {
      setLastNightPriestBlockedId(results.priestBlockedId);
    } else {
      setLastNightPriestBlockedId(null);
    }

    // If police shot occurred TONIGHT, queue it for the next sunset (begin night)!
    if (results.policeShotOccurred) {
      nextPending++;
      setTimeout(() => {
        handleLogEvent(tl(`تک‌تیرانداز پلیس امشب شات خود را خالی کرد؛ قابلیت ترور ناشی از این خشونت در شروع شب بعد به یک تروریست واگذار خواهد شد.`, `تک‌shotانداز Police امnight شات خود را خالی کرد; قابلیت ترور ناشی from this خشونت in start night بعد to a terrorist واگذار خواهد شد.`), 'system');
      }, 120);
    }

    setPendingPoliceTerrorists(nextPending);

    setNightResults({
      ...results,
      terroristsAdded: updatedTerroristsAdded
    });
    
    setGamePhase('day');
    setSelectedTab('day');
    setCycleNumber(nextCycle);
    setCourtExecutedToday(false);
    setPrisonerVerdictGivenToday(false);
    setCurrentDayStep(1);

    // Apply outcomes to real state
    setPlayers((prev) =>
      prev.map((p) => {
        let isAlive = p.isAlive;
        let isBlocked = p.isBlocked;
        let hasShield = p.hasShield;
        let shieldBroken = p.shieldBroken;
        let hasTerroristAbility = p.hasTerroristAbility;

        let hasTerroristAbilityCycle = p.hasTerroristAbilityCycle;

        // If died in night
        if (results.deaths.includes(p.id)) {
          isAlive = false;
        }

        // If shield was breached
        if (results.shieldBreaks.includes(p.id)) {
          shieldBroken = true;
          hasShield = false; // single use
        }

        // If terrorist ability was added
        if (updatedTerroristsAdded.includes(p.id)) {
          hasTerroristAbility = true;
          hasTerroristAbilityCycle = nextCycle;
        }

        // Clean up terrorist ability if they successfully executed/used it (even if blocked)
        if (results.terroristsUsed.includes(p.id)) {
          hasTerroristAbility = false;
          hasTerroristAbilityCycle = undefined;
        }

        return {
          ...p,
          isAlive,
          isBlocked,
          hasShield,
          shieldBroken,
          hasTerroristAbility,
          hasTerroristAbilityCycle,
        };
      })
    );

    // Fill the court nominated list automatically - adhere to capacity constraints and role restrictions
    setCourtSelectedPlayers((prev) => {
      const filteredIncoming = results.courtNominees.filter((id) => {
        const p = players.find((x) => x.id === id);
        return p ? !isRestrictedFromCourt(p) : true;
      });
      const merged = [...prev, ...filteredIncoming];
      const unique = Array.from(new Set(merged));
      return unique.slice(0, 2); // Maximum of 2 nominees in the court
    });

    handleLogEvent(tl(`بیدارباش! خورشید دور جدید فروزان شد. نتایج رویدادهای شب گذشته بروی تابلوی اعلانات قرار گرفت.`, `awakeباش! خورشید round new فdayان شد. results رویدادهای night گذشته بروی تابلوی اعلانات قرار گرفت.`), 'system');
  };

  // Clear night outputs popup
  const handleAcknowledgeNightOutputs = () => {
    setNightResults(null);
  };

  // Timer utilities
  const handleToggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerCount(60);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050609] text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-amber-500 selection:text-slate-900 overflow-hidden relative" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto z-10 px-6 animate-fadeIn">
          <div className="flex justify-end mb-3"><LanguageToggle /></div>
          <div className="bg-[#0a0d14]/80 backdrop-blur-md border border-amber-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
            
            <div className="text-center mb-8 pt-4">
              {/* Cinematic Game Cover Banner */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/25 mb-6 bg-slate-950 shadow-2xl">
                <img
                  src={coverImg}
                  referrerPolicy="no-referrer"
                  alt="Mr. President Game Cover"
                  className="w-full h-auto object-cover block mx-auto opacity-100 rounded-2xl"
                />
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-200 via-amber-400 to-amber-600 tracking-tight font-sans">
                {t('app.title')}
              </h1>
              <p className="text-sm font-semibold text-amber-500/70 mt-3 font-sans tracking-wide">
                {t('app.subtitle')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {authError && (
                <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs p-3 rounded-xl text-center font-bold">
                  {authError}
                </div>
              )}
              {authInfo && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs p-3 rounded-xl text-center font-bold">
                  {authInfo}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 mr-1 block" htmlFor="email">{t('auth.email')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#050609] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500/50 transition pl-10"
                    placeholder={t('auth.email')}
                    required
                  />
                </div>
              </div>
              
              {authMode !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 mr-1 block" htmlFor="password">{t('auth.password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#050609] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500/50 transition pl-10"
                    placeholder={t('auth.password')}
                    required
                  />
                </div>
              </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-xl transition shadow-lg shadow-amber-900/20 mt-4 flex items-center justify-center gap-2"
              >
                {authMode === 'signin' ? t('auth.signIn') : authMode === 'signup' ? t('auth.signUp') : t('auth.sendResetLink')}
              </button>
              <div className="flex flex-col items-center gap-2 pt-2 text-xs">
                {authMode === 'signin' && (
                  <>
                    <button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthInfo(''); }} className="text-amber-400/80 hover:text-amber-300 font-bold">
                      {t('auth.forgotPassword')}
                    </button>
                    <div className="text-slate-500">
                      {t('auth.noAccount')}{' '}
                      <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthInfo(''); }} className="text-amber-400 hover:text-amber-300 font-bold">
                        {t('auth.signUp')}
                      </button>
                    </div>
                  </>
                )}
                {authMode === 'signup' && (
                  <div className="text-slate-500">
                    {t('auth.haveAccount')}{' '}
                    <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthInfo(''); }} className="text-amber-400 hover:text-amber-300 font-bold">
                      {t('auth.signIn')}
                    </button>
                  </div>
                )}
                {authMode === 'forgot' && (
                  <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthInfo(''); }} className="text-amber-400/80 hover:text-amber-300 font-bold">
                    {t('auth.backToLogin')}
                  </button>
                )}
              </div>
            </form>
            <a
              href={SECRET_ROOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('nav.backToSecretRoom')}
              aria-label={t('nav.backToSecretRoom')}
              className="group mt-4 w-full bg-gradient-to-b from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition py-4 flex items-center justify-center gap-3 shadow-lg shadow-black/40 hover:shadow-amber-500/10"
            >
              <img
                src={secretRoomMark.url}
                alt=""
                className="h-12 w-12 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] transition group-hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.7)] group-hover:scale-110"
              />
              <span className="text-amber-400/90 group-hover:text-amber-300 font-bold text-sm tracking-wide transition">
                {t('nav.backToSecretRoom')}
              </span>
            </a>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="fixed bottom-4 left-4 text-[10px] text-slate-600 font-bold tracking-wider z-20">
          {tl('طراحی و توسعه توسط مهربد عدیلی و سعید نوری', 'طراحی and توسعه توسط مهربد عدیلی and سعید نوری')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900 overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Main Navigation Bar */}
      <header className="border-b border-amber-950/20 bg-[#0a0d14]/90 backdrop-blur sticky top-0 z-40 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-400/30 overflow-hidden shrink-0 bg-black">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 id="app-title" className="text-lg font-black text-white tracking-wide gold-glow-text">{t('app.title')}</h1>
              <p className="text-[10px] text-amber-500/80 font-bold tracking-tight">{t('app.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDevMode && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  id="mode-strict-btn"
                  onClick={() => {
                    setExecutionMode('STRICT');
                    localStorage.setItem('president_execution_mode', 'STRICT');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    executionMode === 'STRICT'
                      ? 'bg-[#b90000] text-white shadow-[0_0_12px_rgba(185,0,0,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-white ${executionMode === 'STRICT' ? 'animate-pulse' : 'opacity-60'}`}></span>
                  {tl('سخت‌گیرانه', 'سخت‌گیرانه')}
                </button>
                <button
                  id="mode-controlled-btn"
                  onClick={() => {
                    setExecutionMode('CONTROLLED');
                    localStorage.setItem('president_execution_mode', 'CONTROLLED');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    executionMode === 'CONTROLLED'
                      ? 'bg-[#d97706] text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-white ${executionMode === 'CONTROLLED' ? 'animate-pulse' : 'opacity-60'}`}></span>
                  {tl('کنترل‌شده', 'کنترل‌شده')}
                </button>
                <button
                  id="mode-creative-btn"
                  onClick={() => {
                    setExecutionMode('CREATIVE');
                    localStorage.setItem('president_execution_mode', 'CREATIVE');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    executionMode === 'CREATIVE'
                      ? 'bg-[#059669] text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-white ${executionMode === 'CREATIVE' ? 'animate-pulse' : 'opacity-60'}`}></span>
                  {tl('خلاقانه', 'خلاقانه')}
                </button>
              </div>
            )}

            {/* Logout Button */}
            <LanguageToggle />
            <a
              href={SECRET_ROOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t('nav.backToSecretRoom')}
              aria-label={t('nav.backToSecretRoom')}
              className="group bg-slate-950 hover:bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-lg transition flex items-center justify-center h-9 w-9 shadow-sm cursor-pointer overflow-hidden"
            >
              <img
                src={secretRoomMark.url}
                alt=""
                className="h-6 w-6 object-contain transition group-hover:scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]"
              />
            </a>
            <button
              onClick={handleLogout}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </button>

            {/* Help & Rules Button and other controls have been moved to Footer */}
            {gamePhase !== 'setup' && (
              <>
                {/* Phase badge */}
                <span className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold font-mono">
                  {gamePhase === 'day0' && tl('روز صفر', 'Day Zero')}
                  {gamePhase === 'night0' && tl('شب صفر', 'Night Zero')}
                  {gamePhase === 'day' && tl(`روز ${cycleNumber}`, `day ${cycleNumber}`)}
                  {gamePhase === 'night' && tl(`شب ${cycleNumber}`, `night ${cycleNumber}`)}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {isDevMode && (
        <div className={`transition-all duration-300 py-2 px-6 border-b text-[11px] font-bold text-center flex items-center justify-center gap-2 ${
          executionMode === 'STRICT'
            ? 'bg-[#b90000]/10 border-[#b90000]/25 text-red-400'
            : executionMode === 'CONTROLLED'
            ? 'bg-[#d97706]/10 border-[#d97706]/25 text-amber-400'
            : 'bg-[#059669]/10 border-[#059669]/25 text-emerald-400'
        }`} dir="rtl">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              executionMode === 'STRICT' ? 'bg-red-400' : executionMode === 'CONTROLLED' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              executionMode === 'STRICT' ? 'bg-red-500' : executionMode === 'CONTROLLED' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></span>
          </span>
          <span className="opacity-70 font-black">{tl('قانون حاکم:', 'rule حاکم:')}</span>
          {executionMode === 'STRICT' && (
            <span>{tl('«اگر گفته نشده، وجود ندارد». هرگونه خلاقیت یا امکانات ناخواسته‌ای غیرفعال و ممنوع است.', 'tl("اگر گفته نشده, exists lacks", "اگر گفته نشده, exists lacks"). هرگونه خلاقیت or امکانات ناخواسته‌ای inactive and ممنوع است.')}</span>
          )}
          {executionMode === 'CONTROLLED' && (
            <span>{tl('تنها گزینه‌های تاییدشده و توسعه محدود مجاز است. هر نوع نوآوری مستقل به تایید نیاز دارد.', 'only option‌های confirmشده and توسعه محtwoد مجاز است. each نوع نوآوری مستقل to confirm نیاز has.')}</span>
          )}
          {executionMode === 'CREATIVE' && (
            <span>{tl('ایده‌پردازی و ایجاد گزینه‌های آزمایشی نوآورانه آزاد است.', 'ایده‌پردازی and ایجاد option‌های آزمایشی نوآورانه آزاد است.')}</span>
          )}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        
        {/* CHAOS RESULT MODAL */}
        {chaosModalData && (
          <div className="fixed inset-0 bg-[#04060b]/95 z-50 flex items-center justify-center p-6 animate-fadeIn">
            <div className="max-w-md w-full bg-[#0b0f19] border-2 border-rose-900 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(225,29,72,0.15)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-900 via-rose-500 to-rose-900"></div>
               <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-slate-950 border border-slate-800">
                 <Skull className="w-10 h-10 text-rose-500 animate-pulse" />
               </div>
               <h2 className="text-2xl font-black text-rose-500 tracking-tight mb-4">
                 {tl('نتیجه رأی‌گیری اجباری شهر', 'result voting اجباری city')}
               </h2>
               <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-6">
                 {chaosModalData.isTie ? (
                   <>
                     <p className="text-sm font-bold text-amber-500 mb-2">{tl('تساوی آرا بین بازیکنان:', 'تساوی votes بین players:')}</p>
                     <p className="text-sm text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       {chaosModalData.tiedNames.join('، ')}
                     </p>
                     <p className="text-xs text-rose-400 font-bold mb-1">{tl('قرعه مرگ از سمت سیستم برای:', 'قرعه death from سمت سیستم بvote:')}</p>
                     <p className="text-xl font-black text-white">{chaosModalData.eliminatedName}</p>
                   </>
                 ) : (
                   <>
                     <p className="text-xs text-rose-400 font-bold mb-1">{tl('فرد انتخاب شده جهت خروج اجباری:', 'فرد select شده جهت exit اجباری:')}</p>
                     <p className="text-xl font-black text-white mb-2">{chaosModalData.eliminatedName}</p>
                   </>
                 )}
               </div>
               <button
                 onClick={handleApplyChaosResult}
                 className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition"
               >
                 {tl('اعمال حذف و ادامه', 'اعمال remove and continue')}
               </button>
            </div>
          </div>
        )}

        {/* WINNER SCREEN OVERLAY */}
        {winStatus && (
          <div className="fixed inset-0 bg-[#04060b]/95 z-50 flex items-center justify-center p-6 animate-fadeIn">
            <div className={`max-w-xl w-full border rounded-2xl p-8 text-center shadow-2xl ${
              winStatus === 'freemason' 
                ? 'bg-gradient-to-b from-rose-950/40 to-[#070b13] border-rose-900/50' 
                : 'bg-gradient-to-b from-teal-950/40 to-[#070b13] border-teal-900/50'
            }`}>
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-slate-950 border border-slate-800">
                {winStatus === 'freemason' ? (
                  <Skull className="w-10 h-10 text-rose-500 animate-pulse" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-teal-400" />
                )}
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                {winStatus === 'freemason' ? tl('پیدایش نظم نوین: فراماسون‌ها پیروز شدند!', 'پیدایش نظم نوین: Freemasons پیday شدند!') : tl('عدالت الهی: شهروندان پیروز شدند!', 'عدالت الهی: citizens پیday شدند!')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {winStatus === 'freemason'
                  ? tl('برابری آرای غاصبانه برقرار شد. فراماسون‌های مقتدر توانستند ارکان دولت و ریاست جمهوری را در این نبرد سیاسی تصاحب کنند.', 'برابری آvote غاSabaنه برقرار شد. Freemasons مقتدر توانستند ارکان government and presidency را in this نبرد political تصاحب کنند.')
                  : tl('تلاش‌ها ثمر داد. آخرین نطفه نفوذی‌های فراماسونری توسط قانون قوی و آگاهی مدنی شهر کشف، زندانی یا تیرباران گردید.', 'تلاش‌ها ثمر داد. آخرین نطفه infiltrationی‌های Freemasonری توسط rule قوی and آگاهی civil city کشف, prisoner or shotباران گردید.')}
              </p>

              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl mb-6 text-right">
                <h4 className="text-xs font-bold text-slate-300 mb-2">{tl('وضعیت زنده مانده‌ها:', 'وضعیت alive مانده‌ها:')}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {players.filter(p => p.isAlive).map(p => (
                    <div key={p.id} className="flex justify-between p-1.5 border-b border-slate-900 text-slate-400">
                      <span>{p.name}</span>
                      <span className={p.identity === 'freemason' ? 'text-rose-400' : 'text-sky-400 font-semibold'}>
                        {p.identity === 'freemason' ? tl('فراماسون', 'Freemason') : tl('شهروند', 'citizen')} ({(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleResetGame(true)}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-amber-600/10"
              >
                {tl('راهبری و شروع بازی مجدد', 'راهبری and start game مجدد')}
              </button>
            </div>
          </div>
        )}

        {/* 1. SETUP PHASE */}
        {gamePhase === 'setup' && (
          <div className="max-w-2xl mx-auto bg-[#0a0d14] border border-amber-950/20 rounded-2xl p-6 md:p-8 shadow-2xl animate-fadeIn">
            {/* Cinematic Game Cover Banner */}
            <div className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-amber-500/25 mb-6 bg-slate-950 shadow-2xl animate-fadeIn">
              <img
                src={coverImg}
                referrerPolicy="no-referrer"
                alt="Mr. President Game Cover"
                className="w-full h-auto object-cover block mx-auto opacity-100 rounded-2xl"
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-1 tracking-tight">{tl('آماده‌سازی لژ و مجمع آغازین', 'آماده‌سازی lodge and assembly beginین')}</h2>
            <p className="text-xs text-slate-400 text-center mb-6">
              {tl('جهت تقسیم هویت‌های ۲۹ درصدی و سازمان‌دهی لژ فراماسونری، اسامی بازیکنان مجمع را وارد نمایید.', 'جهت تقسیم identities 29 درصدی and سازمان‌دهی lodge Freemasonری, اسامی players assembly را وارد نمایید.')}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-500/80 mb-2">{tl('اسامی بازیکنان مجمع (جداشده با ویرگول فارسی «،»):', 'اسامی players assembly (جداشده with ویرگول Persian ","):')}</label>
                <textarea
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#04060a] text-slate-100 border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-right"
                  placeholder={tl("مثال: مهرداد، نیما، سپیده، آرمان، صبا، کیوان، بهار، رامین، رویا، سینا...", "مثال: Mehrdad, Nima, Sepideh, Arman, Saba, Kayvan, Bahar, Ramin, Roya, Sina...")}
                />
              </div>

              {/* Informational Box on Masons Calculation */}
              <div className="bg-[#0e121b] border border-amber-950/20 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  محاسبه قانونی حد نصاب مجمع (۲۹٪):
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed text-right">
                  {tl('طبق پیوست اساس‌نامه مجمع، تعداد اعضای لژ فراماسونری دقیقاً ۲۹ درصد کل جمعیت مجمع خواهد بود. اعداد اعشاری برتر از ۰.۵۰ رو به بالا و کمتر رو به پایین گرد می‌شوند.', 'طبق پیوست اساس‌nameه assembly, count اعضای lodge Freemasonری دقیقاً 29 درصد کل جمعیت assembly خواهد بود. اعداد اعشاری برتر from 0.50 رو to بالا and کمتر رو to پایین گرد می‌شوند.')}
                </p>
                <div className="mt-3 text-xs font-semibold text-slate-300 bg-[#04060a] p-2.5 rounded-lg border border-slate-900 flex justify-between items-center">
                  <span>{tl('تعداد اعضای مخفی لژ با این جمعیت:', 'count اعضای hidden lodge with this جمعیت:')}</span>
                  <span className="text-rose-400 bg-rose-950/30 border border-rose-900/40 px-2.5 py-0.5 rounded font-mono font-bold">
                    {calculateMasonCount(
                      playerInput
                        .split(/[,،]/)
                        .map((n) => n.trim())
                        .filter((n) => n.length > 0).length
                    )}{' '}
                    {tl('نفر فراماسون', 'نفر Freemason')}
                  </span>
                </div>
              </div>

              {/* Collapsible Rules and Demographic Requirements */}
              <div className="space-y-2">
                <CollapsibleGuide title={tl("قوانین توازن و الزامات جمعیتی (الزامات شروع مجمع)", "rules balance and الزامات جمعیتی (الزامات start assembly)")} defaultOpen={false}>
                  <div className="space-y-3 pt-2 text-right text-xs text-slate-400 leading-relaxed font-sans" dir="rtl">
                    <p className="font-semibold text-slate-300">
                      قوانین و حضور نقش‌ها در مجمع بر اساس <strong className="text-amber-500">{tl('تعداد بازیکنان در شروع بازی', 'count players in start game')}</strong> تنظیم شده و هرگونه تغییر جمعیت در حین بازی تأثیری بر این مسئولیت‌ها نخواهد گذاشت:
                    </p>
                    
                    <div className="space-y-2.5">
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">{tl('👥 جمعیت ۸ تا ۱۱ نفر:', '👥 جمعیت 8 until 11 نفر:')}</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>{tl('حق رای معاون اول ملغی و به ۱ رای تقلیل می‌یابد.', 'حق vote Vice President ملغی and to 1 vote تقلیل می‌یابد.')}</li>
                          <li>{tl('نقش ', 'role')}<strong className="text-slate-200">{tl('پلیس مسلح', 'Police مسلح')}</strong>{tl(' به‌طور کامل از مجمع حذف می‌شود.', 'به‌طور کامل from assembly remove می‌شود.')}</li>
                        </ul>
                      </div>

                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">{tl('👥 جمعیت ۸ و ۹ نفر:', '👥 جمعیت 8 and 9 نفر:')}</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>{tl('نقش ', 'role')}<strong className="text-slate-200">{tl('معاون اول', 'Vice President')}</strong>{tl(' حذف گردیده و فرآیند انتصاب رده‌های تحت امر وی (خبرنگار و گزارشگر) مستقیماً توسط خود ', 'remove گردیده and فرآیند appointment رده‌های تحت امر وی (Journalist and Reporter) مستقیماً توسط خود')}<strong className="text-slate-200">{tl('رئیس‌جمهور', 'President')}</strong>{tl(' در فاز روز صفر صورت می‌گیرد.', 'in phase Day Zero صورت می‌گیرد.')}</li>
                          <li>{tl('نقش ', 'role')}<strong className="text-slate-200">{tl('کشیش', 'Priest')}</strong>{tl(' به‌طور کامل از بازی حذف گردیده و شب صفر او نادیده گرفته می‌شود.', 'به‌طور کامل from game remove گردیده and Night Zero او نادیده گرفته می‌شود.')}</li>
                        </ul>
                      </div>

                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">{tl('👥 جمعیت ۸ نفر:', '👥 جمعیت 8 نفر:')}</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>{tl('نقش ', 'role')}<strong className="text-slate-200">{tl('وکیل مدافع', 'defense Lawyer')}</strong>{tl(' حذف شده و انتصابی برای آن صورت نخواهد پذیرفت.', 'remove شده and appointmentی بvote that صورت نخواهد پذیرفت.')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CollapsibleGuide>
              </div>

              <button
                onClick={handleStartSetup}
                className="w-full bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-4 rounded-xl text-xs sm:text-sm transition duration-200 shadow-lg shadow-amber-600/10 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                {tl('توزیع قرعه و شروع سناریوی مجمع', 'توزیع قرعه and start سناریوی assembly')}
              </button>
            </div>
          </div>
        )}

        {/* 2. DAY 0 SETTING */}
        {gamePhase === 'day0' && (
          <Day0Setup
            players={players}
            showSecrets={showSecrets}
            onSetRole={handleUpdatePlayerRole}
            onLogEvent={handleLogEvent}
            onCompleteDay0={handleCompleteDay0}
            onUpdatePlayers={setPlayers}
          />
        )}

        {/* 3. NIGHT 0 SETTING - WAKING UP MASONS */}
        {gamePhase === 'night0' && (
          <div className="max-w-xl mx-auto bg-[#0b0f19] border border-[#141b2d] rounded-2xl p-6 text-center shadow-2xl animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-950/20 text-rose-500 border border-rose-900/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Moon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-2">{tl('سکوت محض! بیدارباش شب صفر', 'سکوت محض! awakeباش Night Zero')}</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {tl('هم‌اینک گرداننده فرمان بیدار شدن را به فراماسون‌های بازی می‌دهد.', 'هم‌اینک moderator order awake شدن را to Freemasons game می‌دهد.')}
              {tl('آن‌ها به مدت ۳۰ ثانیه معارفه و به چشمان یکدیگر نگاه می‌کنند تا هم‌رزمان خود در شهر را شناسایی کنند.', 'آن‌ها to مدت 30 ثانیه معارفه and to چشمان یکدیگر نگاه می‌کنند until هم‌رزمان خود in city را شناسایی کنند.')}
            </p>

            <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl mb-6 text-right">
              <h4 className="text-xs font-bold text-rose-300 mb-2">{tl('اسامی لژ فراماسونری امشب:', 'اسامی lodge Freemasonری امnight:')}</h4>
              <div className="space-y-1.5">
                {players
                  .filter((p) => p.identity === 'freemason')
                  .map((p) => (
                    <div key={p.id} className="text-xs font-semibold text-slate-200">
                      • {p.name} - <span className="text-rose-400 font-mono">فراماسون شماره {p.masonNumber}</span>
                    </div>
                  ))}
              </div>
            </div>
            <Night0Terrorist players={players} />

            <button
              onClick={handleStartDay1}
              className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-black px-6 py-3 rounded-lg text-xs transition flex items-center gap-1.5 mx-auto"
            >
              {tl('پایان شب صفر و اعلام آغاز صبح اول', 'End night صفر and اعلام begin صبح اول')}
              <Sun className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4. MAIN INTERACTIVE BOARD (DAY / NIGHT / CHAOS PHASES) */}
        {(gamePhase === 'day' || gamePhase === 'night' || gamePhase === 'chaos') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
            
            {/* Child 1: Left/Middle Column - Top Controls (Status, Search, Timers, Night outputs) */}
            <div className="w-full lg:col-span-2 space-y-6 order-1 lg:row-start-1 lg:col-start-1">
              
              {/* STATUS BAR */}
              <div className="bg-[#0b0f19] border border-[#141b2d] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${gamePhase === 'chaos' ? 'bg-rose-950/40 text-rose-500 border border-rose-900/40' : gamePhase === 'day' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/40'}`}>
                    {gamePhase === 'chaos' ? <Skull className="w-5 h-5 text-rose-500 animate-pulse" /> : gamePhase === 'day' ? <Sun className="w-5 h-5 text-amber-500 animate-spin" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-300">
                      وضعیت پکیج جاری: {gamePhase === 'chaos' ? tl('مرحله اضطراری آشوب شهر', 'stage emergency chaos city') : gamePhase === 'day' ? tl('فاز روز دگردیسی گفتگو', 'day phase دگردیسی discussion') : tl('فاز خواب و عملیات‌های شبانه', 'phase خواب and operation‌های nightانه')}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      تعداد فعال و زنده مجمع: {players.filter((p) => p.isAlive && !p.isImprisoned).length} نفر | فراماسون‌های آزاد زنده: {players.filter((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned).length} نفر
                    </p>
                  </div>
                </div>

                {gamePhase === 'chaos' ? (
                  <div className="text-xs text-rose-400 font-bold bg-rose-955/20 px-3 py-1.5 border border-rose-900/40 rounded-lg animate-pulse">
                    {tl('شهر در وضعیت آشوب قرار دارد', 'city in وضعیت chaos قرار has')}
                  </div>
                ) : gamePhase === 'day' ? (
                  <button
                    onClick={handleBeginNight}
                    className="bg-indigo-955/20 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/20 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    {tl('گذراندن روز و بستن مجمـع', 'گذراندن day and close مجم-ع')}
                    <Moon className="w-4 h-4 text-indigo-400" />
                  </button>
                ) : (
                  <div className="text-xs text-indigo-400 font-bold bg-indigo-955/20 px-3 py-1.5 border border-indigo-900/40 rounded-lg animate-pulse">
                    امشب، شب {cycleNumber} بازیست.
                  </div>
                )}
              </div>

              {/* SPEAKING TIMER & SEARCH CONTROLS */}
              {gamePhase !== 'chaos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SpeakingTimer />
                  <SearchManager 
                    players={players} 
                    showSecrets={showSecrets} 
                    onNavigateToGuide={(id) => {
                      setModeratorGuideScrollId(id);
                      setShowModeratorGuide(true);
                    }}
                  />
                </div>
              )}

              {/* NIGHT RESULTS ACCORDION BANNER */}
              {nightResults && (
                <div className="bg-teal-955/20 border border-teal-900/40 rounded-2xl p-4 text-right shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-teal-900/30 mb-3">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-teal-400 animate-bounce" />
                      تابلو حوادث شب گذشته (خروجی‌های اتوماتیک شب):
                    </span>
                    <button
                      onClick={handleAcknowledgeNightOutputs}
                      className="text-[11px] bg-teal-950 px-2 py-1 rounded text-slate-350 border border-teal-900"
                    >
                      {tl('تایید و بستن جدول', 'confirm and close جtwoل')}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Deaths */}
                    <div>
                      <span className="font-bold text-slate-300">{tl('کشته‌شدگان شب: ', 'killed‌شدگان night:')}</span>
                      {nightResults.deaths.length > 0 ? (
                        <span className="text-red-400 font-semibold bg-red-955 border border-red-900 px-2 py-0.5 rounded">
                          {nightResults.deaths.map(id => players.find(p => p.id === id)?.name).join('، ')}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold bg-emerald-955 border border-emerald-900 px-2 py-0.5 rounded">{tl('خوشبختانه شبی آرام و بدون هیچ کشته‌ای سپری شد.', 'خوnightختانه nightی votesم and without no killed‌ای shieldی شد.')}</span>
                      )}
                    </div>

                    {/* Shield Breaks */}
                    {nightResults.shieldBreaks.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-300">{tl('سپرشِکسته‌ها: ', 'shieldشِکسته‌ها:')}</span>
                        <span className="text-amber-400 font-semibold">
                          {nightResults.shieldBreaks.map(id => players.find(p => p.id === id)?.name).join('، ')} (جان سپر نجاتشان داد)
                        </span>
                      </div>
                    )}

                    {/* Court nominated */}
                    {nightResults.courtNominees.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-slate-300">{tl('ورودی‌های مستقیم دادگاه: ', 'enterی‌های مستقیم court:')}</span>
                          <span className="text-indigo-400 font-semibold">
                            {nightResults.courtNominees.map(id => players.find(p => p.id === id)?.name).join('، ')} (توسط حکم کارآگاه)
                          </span>
                        </div>
                        <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 rounded-xl space-y-1 text-right">
                          <div className="flex items-center gap-1.5 font-extrabold text-[#f59e0b] text-[9.5px]">
                            <Zap className="w-3 h-3 text-amber-400 animate-pulse animate-duration-1000" />
                            <span>{tl('ابلاغ قانون مجمع به بازیکنان (توسط گرداننده):', 'ابلاغ rule assembly to players (توسط moderator):')}</span>
                          </div>
                          <p className="text-[9px] text-[#e2e8f0] leading-relaxed font-semibold">
                            📢 <strong className="text-amber-300 font-extrabold">{tl('توجه:', 'note:')}</strong> با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Terrorists newly added */}
                    {nightResults.terroristsAdded.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-300">{tl('تروریست‌های اتفاقی شب: ', 'terrorists اتفاقی night:')}</span>
                        <span className="text-purple-400 font-semibold bg-purple-955 border border-purple-900 px-2 py-0.5 rounded">
                          {nightResults.terroristsAdded.map(id => players.find(p => p.id === id)?.name).join('، ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTIVE NIGHT COMPONENT */}
              {gamePhase === 'night' && (
                <NightWizard
                  players={players}
                  cycle={cycleNumber}
                  showSecrets={showSecrets}
                  lastPriestBlockedId={lastNightPriestBlockedId}
                  onLogEvent={handleLogEvent}
                  onCompleteNight={handleCompleteNightWizard}
                />
              )}

              {/* CHAOS PHASE COMPONENT */}
              {gamePhase === 'chaos' && (
                <ChaosPhase
                  players={players}
                  speakerOrder={chaosSpeakerOrder}
                  votes={chaosVotes}
                  onVoteChange={handleChaosVoteChange}
                  onSubmitVotes={handleChaosSubmitVotes}
                />
              )}
            </div>

            {/* Child 3: Grid of Players list (Order 3 on mobile, so it shows after the Cabinet actions) */}
            <div className="w-full lg:col-span-2 space-y-6 order-3 lg:order-3 lg:row-start-2 lg:col-start-1">
              {/* GRID OF PLAYERS (Always visible) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-amber-500" />
                    لیست زنده و مرگ بازیکنان مجمع ({players.length} نفر)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {tl('برای تغییر نقش به حالت «اسرار عیان» بروید.', 'بvote change role to حالت "اسرار عیان" بروید.')}
                  </span>
                </div>

                {showSecrets && (
                  <div className="mb-6 p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 text-right" dir="rtl">
                      <span className="text-[10px] font-bold text-amber-500 block mb-1">{tl('➕ اضافه کردن بازیکن جدید به مجمع', '➕ اضافه کردن new player to assembly')}</span>
                      <input
                        type="text"
                        id="new-player-name-input"
                        placeholder={tl("نام بازیکن جدید را بنویسید...", "name new player را بنویسید...")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25 transition duration-200 text-right"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const btn = document.getElementById('add-new-player-btn');
                            if (btn) btn.click();
                          }
                        }}
                      />
                    </div>
                    <button
                      id="add-new-player-btn"
                      onClick={() => {
                        const input = document.getElementById('new-player-name-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleAddPlayer(input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="sm:self-end bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1 shadow-md shadow-amber-950/10"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {tl('افزودن بازیکن جدید', 'افزودن new player')}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      showSecrets={showSecrets}
                      onUpdateRole={handleUpdatePlayerRole}
                      onUpdateIdentity={handleUpdatePlayerIdentity}
                      onToggleAlive={handleTogglePlayerAlive}
                      onToggleImprisoned={handleTogglePlayerImprisoned}
                      onToggleShield={handleTogglePlayerShield}
                      onToggleTerrorist={handleTogglePlayerTerroristAbility}
                      onRemovePlayer={showSecrets ? handleRemovePlayer : undefined}
                      totalPlayers={players.length}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Child 2: Right Column - CABINET / LOGS / GUIDE Tab view (Order 2 on mobile, so it shows right after the top controls) */}
            <div className="w-full bg-[#0b0f19] border border-[#141b2d] rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-2 lg:row-start-1 lg:row-span-2 lg:col-start-3">
              {/* Tab selector */}
              <div className="flex border-b border-[#141b2d] bg-[#070b13]">
                {gamePhase === 'day' && (
                  <button
                    onClick={() => setSelectedTab('day')}
                    className={`flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      selectedTab === 'day' ? 'bg-[#0b0f19] text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    {tl('احکام کابینه روز', 'احکام cabinet day')}
                  </button>
                )}
                <button
                  onClick={() => setSelectedTab('logs')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedTab === 'logs' ? 'bg-[#0b0f19] text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {tl('وقایع مکتوب مجمع', 'وقایع مکتوب assembly')}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5">
                
                {/* TAB 1: EXECUTIVE ORDERS & DAY-PHASE STEP-BY-STEP ASSISTANT */}
                {selectedTab === 'day' && gamePhase === 'day' && (
                  <div className="space-y-6">
                    
                    {/* CABINET STATUS HUD */}
                    <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                        <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                          {tl('تشکیلات کابینه دولتی مستقر:', 'تشکیلات cabinet governmentی مستقر:')}
                        </h4>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
                          روز {cycleNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">{tl('رئیس جمهور:', 'President:')}</span>
                          <span className={`font-extrabold text-xs ${cabinet.presidentId ? 'text-amber-400' : 'text-slate-600'}`}>
                            {cabinet.presidentId ? players.find((p) => p.id === cabinet.presidentId)?.name : tl('بدون تصدی (فوت)', 'without تصدی (death)')}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          {players.length < 10 ? (
                            <>
                              <span className="block text-slate-500 font-bold">{tl('معاون اول:', 'Vice President:')}</span>
                              <span className="text-slate-600 italic">{tl('حذف شده در شروع', 'remove شده in start')}</span>
                            </>
                          ) : (
                            <>
                              <span className="block text-slate-500 font-bold">معاون اول ({players.length < 12 ? tl('۱ رای', '1 vote') : tl('۲ رای', '2 vote')}):</span>
                              <span className={`font-semibold ${cabinet.vicePresidentId ? 'text-slate-300' : 'text-slate-600'}`}>
                                {cabinet.vicePresidentId ? players.find((p) => p.id === cabinet.vicePresidentId)?.name : tl('بدون تصدی', 'without تصدی')}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">{tl('شهردار مجمع:', 'Mayor assembly:')}</span>
                          <span className={`font-semibold ${cabinet.mayorId ? 'text-slate-300' : 'text-slate-600'}`}>
                            {cabinet.mayorId ? players.find((p) => p.id === cabinet.mayorId)?.name : tl('بدون تصدی', 'without تصدی')}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">{tl('قاضی تالار:', 'Judge hall:')}</span>
                          <span className={`font-semibold ${cabinet.judgeId ? 'text-slate-300' : 'text-slate-600'}`}>
                            {cabinet.judgeId ? players.find((p) => p.id === cabinet.judgeId)?.name : tl('بدون تصدی', 'without تصدی')}
                          </span>
                        </div>
                      </div>
                      
                      <CollapsibleGuide title={tl("ساختار کابینه و مسئولین منصوب", "ساختار cabinet and مسئولین appointed")} defaultOpen={false}>
                          <div className="space-y-3 pt-2">
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-amber-400 mb-1">{tl('دستیاران معاون رئیس‌جمهور:', 'assistantان Vice President President:')}</p>
                                  <p className="text-[10px] text-slate-400">گزارشگر: {players.find(p => p.role === 'reporter')?.name || tl('نامشخص', 'nameشخص')} | خبرنگار: {players.find(p => p.role === 'journalist')?.name || tl('نامشخص', 'nameشخص')}</p>
                              </div>
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-rose-400 mb-1">{tl('دستیاران قاضی:', 'assistantان Judge:')}</p>
                                  <p className="text-[10px] text-slate-400">وکیل: {players.find(p => p.role === 'lawyer')?.name || tl('نامشخص', 'nameشخص')}</p>
                              </div>
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-sky-400 mb-1">{tl('دستیاران شهردار:', 'assistantان Mayor:')}</p>
                                  <p className="text-[10px] text-slate-400">دکتر: {players.find(p => p.role === 'doctor')?.name || tl('نامشخص', 'nameشخص')} | پلیس: {players.find(p => p.role === 'police')?.name || tl('نامشخص', 'nameشخص')} | کارآگاه: {players.find(p => p.role === 'detective')?.name || tl('نامشخص', 'nameشخص')}</p>
                              </div>
                          </div>
                      </CollapsibleGuide>
                    </div>

                    {/* ASSISTANT STEPPER */}
                    <div className="bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-xl flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none">
                      {[
                        { title: tl('حوادث', 'حوادث'), id: 1 },
                        { title: tl('تروریست', 'terrorist'), id: 2 },
                        { title: tl('انقلاب', 'revolution'), id: 3 },
                        { title: tl('ریاست', 'ریاست'), id: 4 },
                        { title: tl('دفاعیه', 'defense'), id: 5 },
                        { title: tl('احکام', 'احکام'), id: 6 }
                      ].map((stp) => {
                        const isCurrent = currentDayStep === stp.id;
                        const isDone = currentDayStep > stp.id;
                        return (
                          <button
                            key={stp.id}
                            onClick={() => {
                              if (currentDayStep === 4 && stp.id > 4) {
                                if (!canProceedFromPresidentStep(true)) {
                                  return;
                                }
                              }
                              setCurrentDayStep(stp.id);
                            }}
                            className={`flex-1 text-center py-1.5 px-2 rounded-lg transition text-[9px] font-black whitespace-nowrap flex items-center justify-center gap-1 min-w-[55px] ${
                              isCurrent
                                ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/15'
                                : isDone
                                ? 'bg-amber-900/20 text-amber-500 border border-amber-900/30'
                                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <span>{stp.id}.</span>
                            <span>{stp.title}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* STEP 1: NIGHT EVENTS AND EMERGENCIES (حوادث و گزارش‌های شب) */}
                    {currentDayStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title={tl("گام ۱ از ۷: اعلام حوادث دیشب مجمع", "step 1 from 7: اعلام حوادث دیnight assembly")} defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            {tl('خروجی خودکار شب گذشته اعم از اعدام ها، ترورهای مستقیم لژ و سپرهای مخدوش شده را به حضار اعلام بفرمایید.', 'exitی خودکار night گذشته اعم from execution ها, ترورهای مستقیم lodge and shieldهای مخtwoش شده را to حضار اعلام بفرمایید.')}
                            <br/><br/>
                            <strong className="text-teal-400">{tl('راهنمای جانشینی کشیش (قاعده ۴):', 'guide of succession Priest (قاعده 4):')}</strong>{tl(' در صورت کشته شدن کشیش مجمع، پاپ اعظم مجاز است یکی از ', 'in صورت killed شدن Priest assembly, High Pope مجاز است یکی from')}<strong>{tl('شهروندان ساده و بدون نقش', 'citizens plain and without role')}</strong>{tl(' را به مقام کشیش جدید منصوب کند. این انتصاب کاملاً ', 'را to office Priest new appointed کند. this appointment fully')}<strong>{tl('اختیاری', 'optional')}</strong> است، اما در صورت عدم انتصاب، قابلیت مشترک پاپ و کشیش (ابطال اعدام زندانی) منجمد می‌شود. پاپ فقط مجاز به تعیین افراد بدون نقش (ساده) است.
                          </p>
                        </CollapsibleGuide>

                        {nightResults && (nightResults.deaths.length > 0 || nightResults.shieldBreaks.length > 0) ? (
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-xs text-slate-350 space-y-1.5">
                            {nightResults.deaths.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span>{tl('مقتولین شب گذشته: ', 'killedین night گذشته:')}<strong className="text-red-400">{nightResults.deaths.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                              </div>
                            )}
                            {nightResults.shieldBreaks.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>{tl('اصابت ناموفق شلیک (سپرِ تخریب‌شده): ', 'اصابت failed shot (shieldِ تخریب‌شده):')}<strong className="text-amber-400">{nightResults.shieldBreaks.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                              </div>
                            )}
                            {nightResults.courtNominees.length > 0 && (
                              <div className="space-y-1.5 pt-1.5 border-t border-slate-900/40">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span>{tl('متهمین مستقیم دادرسی کارآگاه: ', 'defendantین مستقیم دادرسی Detective:')}<strong className="text-indigo-400">{nightResults.courtNominees.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                                </div>
                                <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-right">
                                  <p className="text-[9px] text-slate-300 leading-normal font-semibold">
                                    📢 <strong className="text-amber-400 font-extrabold font-sans">{tl('تذکر به بازیکنان:', 'reminder to players:')}</strong> با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-emerald-950/20 border border-emerald-900/35 p-3 rounded-xl text-center text-[10px] text-emerald-400 font-semibold leading-relaxed">
                            {tl('✅ خوشبختانه شبی آرام سپری شد و صبح بدون هیچ مقتولی سر بر آورد.', '✅ خوnightختانه nightی votesم shieldی شد and صبح without no killedی سر on آورد.')}
                          </div>
                        )}

                        {/* Emergency Succession helpers */}
                        {/* 1. Priest Dead and Pope Alive -> Assign a new priest */}
                        {!players.some(p => p.role === 'priest' && p.isAlive) && players.some(p => p.role === 'pope' && p.isAlive) && (
                          <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-2 mt-2">
                            <span className="text-[10px] font-extrabold text-teal-400 block mb-1">{tl('⛪ انتصاب جانشین کشیش توسط پاپ اعظم (قاعده ۴)', '⛪ appointment successor Priest توسط High Pope (قاعده 4)')}</span>
                            {(() => {
                              const pope = players.find(p => p.role === 'pope' && p.isAlive);
                              return pope ? (
                                <div className="text-[10px] font-bold text-teal-300">
                                  👤 پاپ اعظم مجری اقدام: <span className="underline decoration-teal-500/50 decoration-2 underline-offset-2 text-white font-extrabold">{pope.name}</span>
                                </div>
                              ) : null;
                            })()}
                            
                            {players.some(p => p.isAlive && p.role === 'none') ? (
                              <>
                                <p className="text-[9px] text-slate-400 leading-normal">
                                  با مقتول شدن کشیش مجمع، پاپ اجازه دارد از بازیکنان فاقد نقش زنده، یک نفر را مجدداً ردای مقدس کشیش بپوشاند. (انتخاب اختیاری است)
                                </p>
                                <div className="flex gap-1.5">
                                  <select
                                    id="pope-assign-priest-select"
                                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded p-1.5 focus:outline-none col-span-2 grow"
                                  >
                                    <option value="">{tl('برگزیدن شهروند بدون نقش...', 'choose citizen without role...')}</option>
                                    {players.filter(p => p.isAlive && p.role === 'none').map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const s = document.getElementById('pope-assign-priest-select') as HTMLSelectElement;
                                      if (s && s.value) {
                                        handlePopeAssignNewPriest(s.value);
                                        s.value = '';
                                      } else {
                                        alert(tl('لطفاً یک بازیکن واجد شرایط انتخاب کنید.', 'Please a player واجد conditions select کنید.'));
                                      }
                                    }}
                                    className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black px-3 py-1 rounded transition whitespace-nowrap"
                                  >
                                    {tl('تایید کشیش', 'confirm Priest')}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="text-[9.5px] text-rose-400 leading-relaxed font-bold bg-rose-950/20 p-2 border border-rose-900/30 rounded">
                                ⚠️ متاسفانه هیچ شهروند بدون نقشی (آزاد) برای تصدی جایگاه کشیش در دسترس نیست. پاپ می‌تواند تا زمان آزادی یک فرد از زندان یا به وجود آمدن شهروند آزاد صبر کند. در این مدت، قابلیت مشترک پاپ و کشیش (وتوی زندان) غیرفعال خواهد بود.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(2)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>{tl('ورود به گام دوم: فتنه و انتحار تروریستی روز', 'enter to step twoم: فتنه and suicide attack terroristی day')}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: TERRORIST ACTIONS (اقدامات ترور روز) */}
                    {currentDayStep === 2 && (() => {
                      const dayTerrorists = players.filter((p) => p.hasTerroristAbility && p.isAlive && p.hasTerroristAbilityCycle !== undefined && cycleNumber >= p.hasTerroristAbilityCycle);
                      
                      return (
                        <div className="space-y-4 animate-fadeIn">
                          <CollapsibleGuide title={tl("گام ۲ از ۷: فتنه و انتحار تروریستی روز", "step 2 from 7: فتنه and suicide attack terroristی day")} defaultOpen={false}>
                             <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                               تروریست‌های دارای بمب فعال در روز جاری را به گرداننده معرفی کنید تا اقدام به خروج خود خواسته و متقابل بازیکنان نمایند.<br/>
                               <span className="text-amber-500/80 mt-1 block font-bold">{tl('- توجه: پزشک و سپر بی‌اثر است. اما اگر هدف درون زندان باشد فقط تروریست منفجر می‌شود!', '- note: پزشک and shield بی‌اثر است. اما اگر target درون prison باشد only terrorist detonate می‌شود!')}</span>
                             </p>
                          </CollapsibleGuide>

                          {dayTerrorists.length > 0 ? (
                            <div className="bg-purple-500/15 border border-purple-500/25 text-purple-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>{tl('👤 تروریست‌های واجد شرایطِ اقدام امروز:', '👤 terrorists واجد conditionsِ action امday:')}</span>
                              <span className="font-extrabold text-white underline decoration-purple-500/50 underline-offset-2">{dayTerrorists.map(p => p.name).join('، ')}</span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/40 border border-slate-800 text-slate-500 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              {tl('⚠️ هیچ تروریست بمب‌داری در مجمع زنده نیست!', '⚠️ no terrorist bomb‌داری in assembly alive نیست!')}
                            </div>
                          )}

                          <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                            <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded-xl text-xs space-y-1.5 text-right">
                              <span className="text-slate-400 text-[10px] block font-bold">{tl('تروریست‌های انقلابی امروز مجمع:', 'terrorists revolutionی امday assembly:')}</span>
                              {dayTerrorists.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {dayTerrorists.map(p => (
                                    <span key={p.id} className="bg-purple-950/60 text-purple-300 px-2.5 py-1 rounded-lg font-bold border border-purple-800/40 text-[11px]">
                                      🧨 {p.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-slate-500 font-bold">{tl('هیچ تروریست بمب‌داری در مجمع زنده نیست!', 'no terrorist bomb‌داری in assembly alive نیست!')}</div>
                              )}
                            </div>

                            {dayTerrorists.length > 0 && (
                              <div className="space-y-3 p-3 bg-slate-900/50 rounded-xl border border-slate-850">
                                <span className="text-[10px] font-black text-slate-300 block mb-1">{tl('اجرای بمباران انتحاری:', 'اجvote bombاران suicide:')}</span>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{tl('انتخاب عامل تروریست:', 'select عامل terrorist:')}</label>
                                    <select
                                      id="day-terrorist-shooter"
                                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded p-1.5 focus:outline-none focus:border-purple-800 text-right"
                                    >
                                      {dayTerrorists.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">{tl('انتخاب هدف بیگناه برای انفجار:', 'select target بیگناه بvote explosion:')}</label>
                                    <select
                                      id="day-terrorist-target"
                                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded p-1.5 focus:outline-none focus:border-purple-800 text-right"
                                    >
                                      <option value="">{tl('برگزیدن بازیکن برای ترور...', 'choose player بvote ترور...')}</option>
                                      {players.filter(p => p.isAlive).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => {
                                      const shooterSel = document.getElementById('day-terrorist-shooter') as HTMLSelectElement;
                                      const targetSel = document.getElementById('day-terrorist-target') as HTMLSelectElement;
                                      if (shooterSel?.value && targetSel?.value) {
                                        if (shooterSel.value === targetSel.value) {
                                          alert(tl('تروریست طبق قوانین مجمع نمی‌تواند روی خودش انتحار انجام دهد!', 'terrorist طبق rules assembly cannot روی خودش suicide attack انجام دهد!'));
                                          return;
                                        }
                                        let doExplode = true;
                                        try {
                                          doExplode = !window.confirm || confirm(tl(`آیا مایلید بازیکن تروریست را قرینِ هدف منتخب منفجر و هر دو را از بازی خارج کنید؟`, `آیا مایلید player terrorist را قرینِ target منتخب detonate and each two را from game خارج کنید?`));
                                        } catch (e) {
                                          doExplode = true;
                                        }
                                        if (doExplode) {
                                          const shooterId = shooterSel.value;
                                          const targetId = targetSel.value;
                                          
                                          const shooter = players.find(p => p.id === shooterId);
                                          const target = players.find(p => p.id === targetId);
                                          if (shooter && target) {
                                            setPlayers((prev) =>
                                              prev.map((p) => {
                                                if (p.id === shooterId) {
                                                  return { ...p, isAlive: false, hasTerroristAbility: false, hasTerroristAbilityCycle: undefined };
                                                }
                                                if (p.id === targetId && !target.isImprisoned) {
                                                  return { ...p, isAlive: false, hasTerroristAbility: false, hasTerroristAbilityCycle: undefined };
                                                }
                                                return p;
                                              })
                                            );
                                            if (target.isImprisoned) {
                                              handleLogEvent(tl(`[انتحار بی‌ثمر در زندان] بازیکن تروریست غیور «${shooter.name}» با فعال نمودن جلیقه انفجاری مجمع، به سلول زندان یورش برد اما میله‌های فولادی مانع آسیب به «${target.name}» شد و تنها خودش به هوا رفت!`, `[suicide attack بی‌ثمر in prison] player terrorist غیور "${shooter.name}" with active نمودن جلیقه explosionی assembly, to cell prison یورش برد اما میله‌های فولادی مانع آسیب to "${target.name}" شد and only خودش to هوا رفت!`), 'kill');
                                            } else {
                                              handleLogEvent(tl(`[انتحار تروریستی روز] بازیکن تروریست غیور «${shooter.name}» با فعال نمودن جلیقه انفجاری مجمع، خود را به همراهِ بازیکن «${target.name}» به هوا فرستاد!`, `[suicide attack terroristی day] player terrorist غیور "${shooter.name}" with active نمودن جلیقه explosionی assembly, خود را to همراهِ player "${target.name}" to هوا فرستاد!`), 'kill');
                                            }
                                            targetSel.value = '';
                                          }
                                        }
                                      } else {
                                        alert(tl('لطفاً عامل تروریست و هدف قربانی را انتخاب کنید.', 'Please عامل terrorist and target victim را select کنید.'));
                                      }
                                    }}
                                    className="w-full bg-red-900 hover:bg-red-800 border border-red-700 text-white text-[10px] font-black py-2 rounded-lg transition"
                                  >
                                    چکاندن ضامن بمب (کشتار متقابل)
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setCurrentDayStep(1)}
                              className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                            >
                              <ChevronRight className="w-4 h-4" />
                              {tl('برگشت', 'Back')}
                            </button>
                            <button
                              onClick={() => setCurrentDayStep(3)}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                            >
                              <span>{tl('ورود به گام سوم: انقلاب شهرداری', 'enter to step سوم: Mayor revolution')}</span>
                              <ChevronLeft className="w-4 h-4 text-slate-950" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* STEP 3: COUPS AND REVOLUTIONS (انقلاب شهردار) */}
                    {currentDayStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title={tl("گام ۲ از ۶: دادگاه انقلاب شهرداری", "step 2 from 6: court Mayor revolution")} defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            شهردار زنده مجمع می‌تواند در تالار روز لایحه انقلاب صادر کند.<br/>
                            <span className="text-rose-400 font-bold block mt-1">{tl('- پاپ مطلقا امکان وتوی لایحه انقلاب را ندارد.', '- Pope مطلقا امکان veto لایحه revolution را lacks.')}</span>
                            <span className="text-amber-400/90 font-bold block mt-1">{tl('- قاضی نیز هیچ‌گونه حق وتوی انفرادی در انقلاب شهردار ندارد؛ سرنوشت انقلاب کاملاً به رای اکثریت (نصف + ۱) گره خورده است.', '- Judge نیز هیچ‌گونه حق veto solitary in Mayor revolution lacks; سرنوشت revolution fully to vote majority (نصف + 1) گره خورده است.')}</span>
                            <span className="text-emerald-400/90 font-bold block mt-1">{tl('- در صورت موفقیت کودتا، شهردار فوراً جانشین رئیس‌جمهور شده و رئیس‌جمهور سابق مستقیماً متهم دادگاه می‌شود. شکست به معنای خلع شهردار و فرستادن او به دادگاه است!', '- in صورت successfulیت coup, Mayor فوراً successor President شده and President سابق مستقیماً defendant court می‌شود. شکست to معنای خلع Mayor and فرستادن او to court است!')}</span>
                            <span className="text-amber-400/90 font-bold block mt-1">{tl('- تنش این دادگاه (موفق یا ناموفق) سبب ایجاد بی‌درنگِ ۱ قابلیت تروریست تصادفی می‌شود که در شب قابلیت اقدام دارد.', '- tension this court (successful or failed) سبب ایجاد بی‌درنگِ 1 قابلیت terrorist random می‌شود که in night قابلیت action has.')}</span>
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const mayor = cabinet.mayorId ? players.find(p => p.id === cabinet.mayorId) : null;
                          return mayor ? (
                            <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>{tl('👤 شهردار مجری اقدام انقلاب امروز:', '👤 Mayor مجری action revolution امday:')}</span>
                              <span className="font-extrabold text-white underline decoration-emerald-500/50 underline-offset-2">{mayor.name}</span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/40 border border-slate-800 text-slate-500 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              {tl('⚠️ شهردار فعالی برای انقلاب در مجمع وجود ندارد.', '⚠️ Mayor activeی بvote revolution in assembly exists lacks.')}
                            </div>
                          );
                        })()}

                        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                            <span className="text-slate-500">{tl('مقام شهردار مجمع:', 'office Mayor assembly:')}</span>
                            <span className={cabinet.mayorId ? 'text-amber-400' : 'text-slate-600'}>
                              {cabinet.mayorId ? players.find(p => p.id === cabinet.mayorId)?.name : tl('هیچکس زنده نیست (فاقد اقدام)', 'no one alive نیست (فاقد action)')}
                            </span>
                          </div>
                          
                          {cabinet.mayorId && cabinet.presidentId ? (
                            <div className="space-y-3">
                              <p className="text-[9px] text-slate-500">{tl('رای‌های مجمع شمرده شود: اگر تعداد آرا بالاتر از نصف مجمع + ۱ باشد مصلح انقلاب موفق بوده و تالار به فرمان شهردار جابه‌جا می‌گردد.', 'vote‌های assembly شdead شود: اگر count votes بالاتر from نصف assembly + 1 باشد مصلح revolution successful بوده and hall to order Mayor جابه‌جا می‌گردد.')}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleMayorRevolution(true)}
                                  disabled={mayorRevoltedToday}
                                  className={`text-[10px] py-2 font-black rounded-lg border ${
                                    mayorRevoltedToday
                                      ? 'bg-slate-900 border-none text-slate-650 cursor-not-allowed'
                                      : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20'
                                  }`}
                                >
                                  {mayorRevoltedToday ? tl('انقلاب ثبت شده', 'revolution record شده') : tl('انقلاب موفق (تنزيل رئیس)', 'revolution successful (تنزيل رئیس)')}
                                </button>
                                <button
                                  onClick={() => handleMayorRevolution(false)}
                                  disabled={mayorRevoltedToday}
                                  className={`text-[10px] py-2 font-black rounded-lg border ${
                                    mayorRevoltedToday
                                      ? 'bg-slate-905 border-none text-slate-650'
                                      : 'bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-900/20'
                                  }`}
                                >
                                  {mayorRevoltedToday ? tl('انقلاب ثبت شده', 'revolution record شده') : tl('انقلاب ناموفق (متهم شدن شهردار)', 'revolution failed (defendant شدن Mayor)')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 text-center py-2">{tl('شرایط ائتلاف مهیا نیست (فوت یکی از طرفین قدرت رئیس/شهردار).', 'conditions ائتلاف مهیا نیست (death یکی from طرفین قدرت رئیس/Mayor).')}</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(2)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {tl('برگشت', 'Back')}
                          </button>
                          <button
                            onClick={() => setCurrentDayStep(4)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>{tl('ورود به گام چهارم: عزل و نصب ریاست', 'enter to step fourم: عزل and نصب ریاست')}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: PRESIDENT ROLE MANAGEMENT (اختیارات رئیس جمهور) */}
                    {currentDayStep === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title={tl("گام ۴ از ۷: جابه‌جایی و انتصابات ریاست مجمع", "step 4 from 7: swap and appointmentات ریاست assembly")} defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            {tl('رئیس‌جمهور در صورت حیاة می‌تواند بین دو جایگاه جابه‌جایی امضا کند، و یا نقشهای مقتول شهر را به غیر اختصاص دهد.', 'President in صورت حیاة can بین two position swap امضا کند, and or roleهای killed city را to غیر اختصاص دهد.')}
                            <br/><br/>
                            🚨 <strong className="text-amber-400">{tl('قانون محدودیت مهره دوم:', 'rule محtwoدیت second piece:')}</strong>{tl(' طبق مصوبات جدید مجمع، اگر نقش انتخاب شده در ', 'طبق مصوبات new assembly, اگر role select شده in')}<strong>{tl('مهره نخست (مهر اول)', 'first piece (مهر اول)')}</strong>{tl(' خالی و بدون بازیکن بوده باشد (نقش مقتول)، بازیکنانِ تالار که دارای نقش‌های زنده و فعالِ ', 'خالی and without player بوده باشد (role killed), playersِ hall که داvote roles alive and activeِ')}<strong>{tl('قاضی', 'Judge')}</strong>{tl(' یا ', 'or')}<strong>{tl('شهردار', 'Mayor')}</strong>{tl(' هستند، هرگز نباید به عنوان برگزیده در ', 'هستند, هرگز نmust to عنوان برگزیده in')}<strong>{tl('مهره دوم (مهر دوم)', 'second piece (مهر twoم)')}</strong> دیده شوند یا این نقش‌ها را تصاحب نمایند.
                            <br/><br/>
                            <strong className="text-rose-400">{tl('راهنمای بحران کلیسا (قاعده ۸ - فوت همزمان):', 'guide of crisis کلیسا (قاعده 8 - death همزمان):')}</strong>{tl(' در صورتی که ', 'in صورتی که')}<strong>{tl('پاپ و کشیش به صورت همزمان', 'Pope and Priest to صورت همزمان')}</strong>{tl(' کشته شده باشند (مثلاً با بمب تروریست)، رئیس‌جمهور مجاز و ', 'killed شده باشند (مثلاً with bomb terrorist), President مجاز and')}<strong>{tl('موظف', 'موظف')}</strong> است یک نفر را برای مقام پاپ اعظم منصوب کند. (اولویت اول با بازیکنان بدون نقش است. در غیر این صورت از میان سایر بازیکنان واجد شرایط به صورت چرخشی استفاده می‌شود.)
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const president = cabinet.presidentId ? players.find(p => p.id === cabinet.presidentId) : null;
                          return president ? (
                            <div className="bg-amber-500/15 border border-amber-500/25 text-amber-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>{tl('👤 رئیس‌جمهور مجری جابه‌جایی و انتصابات:', '👤 President مجری swap and appointmentات:')}</span>
                              <span className="font-extrabold text-white underline decoration-amber-500/50 underline-offset-2">{president.name}</span>
                            </div>
                          ) : (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              {tl('⚠️ رئیس‌جمهور فعالی در مجمع حضور ندارد یا فوت شده است.', '⚠️ President activeی in assembly presence lacks or death شده است.')}
                            </div>
                          );
                        })()}

                        {cabinet.presidentId ? (
                          <div className="space-y-4">
                            {/* Unified President Action: Swap/Fill */}
                            <div className="p-3.5 bg-slate-950/40 border border-slate-850/60 rounded-xl shadow-lg hover:border-amber-500/10 transition-all duration-300">
                              <span className="text-[10px] font-bold text-amber-400 block mb-2">{tl('🔄 اختیارات قانونی ریاست‌جمهوری (پر کردن/جابه‌جایی نقش‌ها)', '🔄 powers ruleی presidency (پر کردن/swap roles)')}</span>
                              <p className="text-[8.5px] text-slate-400 leading-normal mb-3">
                                <strong>{tl('مهره نخست (نقش):', 'first piece (role):')}</strong>{tl(' اولویت اول با قاضی خالی، اولویت دوم با سایر نقش‌های خالی، اولویت سوم جابه‌جایی نقش‌های موجود.', 'اولویت اول with Judge خالی, اولویت twoم with سایر roles خالی, اولویت سوم swap roles مexists.')}<br/>
                                <strong>{tl('مهره دوم (بازیکن):', 'second piece (player):')}</strong>{tl(' اولویت مطلق با بازیکنان بدون نقش است. ', 'اولویت مطلق with players without role است.')}<span className="text-rose-400 font-bold">{tl('(توجه: اگر مهره نخست بدون بازیکن/خالی باشد، بازیکنان دارای نقش قاضی و شهردار در مهره دوم دیده نخواهند شد)', '(note: اگر first piece without player/خالی باشد, players داvote role Judge and Mayor in second piece دیده نخواهند شد)')}</span>.
                              </p>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <select
                                    id="president-unified-role"
                                    value={selectedPresidentUnifiedRole}
                                    onChange={(e) => {
                                      setSelectedPresidentUnifiedRole(e.target.value);
                                      const pSelect = document.getElementById('president-unified-player') as HTMLSelectElement;
                                      if (pSelect) pSelect.value = '';
                                    }}
                                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded p-1.5 focus:outline-none"
                                  >
                                    {(() => {
                                      const aliveRoles = new Set(players.filter(p => p.isAlive && !p.isImprisoned).map(p => p.role));
                                      
                                      if (!aliveRoles.has('judge')) {
                                        return (
                                          <>
                                            <option value="">{tl('مهره نخست...', 'first piece...')}</option>
                                            <option value="judge">{tl('قاضی', 'Judge')}</option>
                                          </>
                                        );
                                      }
                                      
                                      if (!aliveRoles.has('mayor')) {
                                        return (
                                          <>
                                            <option value="">{tl('مهره نخست...', 'first piece...')}</option>
                                            <option value="mayor">{tl('شهردار', 'Mayor')}</option>
                                          </>
                                        );
                                      }
                                      
                                      const otherCanonical: RoleType[] = ['reporter', 'journalist', 'doctor', 'detective'];
                                      if (players.length >= 12) otherCanonical.push('police');
                                      if (players.length >= 10) otherCanonical.push('vice_president');
                                      if (players.length >= 9) otherCanonical.push('lawyer');
                                      const otherVacant = otherCanonical.filter(r => !aliveRoles.has(r));
                                      
                                      if (otherVacant.length > 0) {
                                        return (
                                          <>
                                            <option value="">{tl('مهره نخست...', 'first piece...')}</option>
                                            {otherVacant.map(r => (
                                              <option key={r} value={r}>{ROLE_DETAILS[r].nameFa}</option>
                                            ))}
                                          </>
                                        );
                                      }

                                      return (
                                        <>
                                          <option value="">{tl('مهره نخست...', 'first piece...')}</option>
                                          {players.filter(p => p.isAlive && !p.isImprisoned && p.role !== 'none' && p.role !== 'president' && p.role !== 'pope' && p.role !== 'priest' && p.role !== 'judge').map(p => (
                                            <option key={p.id} value={p.role}>{(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa} (از {p.name})</option>
                                          ))}
                                        </>
                                      );
                                    })()}
                                  </select>

                                  <select
                                    id="president-unified-player"
                                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded p-1.5 focus:outline-none"
                                  >
                                    {(() => {
                                      const aliveRoles = new Set(players.filter(pl => pl.isAlive && !pl.isImprisoned).map(pl => pl.role));
                                      const isFirstPieceVacant = selectedPresidentUnifiedRole && !aliveRoles.has(selectedPresidentUnifiedRole as any);

                                      const rolelessCandidates = players.filter(p => p.isAlive && !p.isImprisoned && p.role === 'none');
                                      const hasRoleless = rolelessCandidates.length > 0;
                                      
                                      const candidates = players.filter(p => {
                                        if (!p.isAlive || p.isImprisoned || p.role === 'president' || p.role === 'pope' || p.role === 'priest') return false;
                                        
                                        // User boundary rule: if first piece was vacant, do not show players with Judge/Mayor roles
                                        if (isFirstPieceVacant && (p.role === 'judge' || p.role === 'mayor')) return false;

                                        if (hasRoleless) return p.role === 'none';
                                        return true;
                                      });
                                      
                                      return (
                                        <>
                                          <option value="">{tl('مهره دوم...', 'second piece...')}</option>
                                          {candidates.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} {p.role !== 'none' ? `(${(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})` : ''}</option>
                                          ))}
                                        </>
                                      );
                                    })()}
                                  </select>
                                </div>
                                <button
                                  onClick={() => {
                                    const r = document.getElementById('president-unified-role') as HTMLSelectElement;
                                    const p = document.getElementById('president-unified-player') as HTMLSelectElement;
                                    if (r && p && r.value && p.value) {
                                      const rValue = r.value as RoleType;
                                      const pValue = p.value;
                                      
                                      const aliveRoles = new Set(players.filter(pl => pl.isAlive && !pl.isImprisoned).map(pl => pl.role));
                                      const canonicalRoles: RoleType[] = ['judge', 'mayor', 'reporter', 'journalist', 'doctor', 'detective'];
                                      if (players.length >= 12) canonicalRoles.push('police');
                                      if (players.length >= 10) canonicalRoles.push('vice_president');
                                      if (players.length >= 9) canonicalRoles.push('lawyer');
                                      const isVacant = canonicalRoles.includes(rValue) && !aliveRoles.has(rValue);
                                      
                                      if (isVacant) {
                                          handlePresidentFillVacantRole(pValue, rValue);
                                      } else {
                                          const holder = players.find(player => player.role === rValue && player.isAlive && !player.isImprisoned);
                                          if (holder) {
                                              handlePresidentSwapRoles(holder.id, pValue);
                                          }
                                      }
                                      r.value = '';
                                      p.value = '';
                                      setSelectedPresidentUnifiedRole('');
                                    } else {
                                      alert(tl('لطفاً مهره نخست (نقش) و مهره دوم (بازیکن) را انتخاب کنید.', 'Please first piece (role) and second piece (player) را select کنید.'));
                                    }
                                  }}
                                  disabled={presidentSwappedToday}
                                  className={`w-full text-[10px] font-black py-1.5 rounded-lg transition ${
                                    presidentSwappedToday
                                      ? 'bg-slate-900 text-slate-650 cursor-not-allowed'
                                      : 'bg-amber-600 hover:bg-amber-700 text-slate-950'
                                  }`}
                                >
                                  {presidentSwappedToday ? tl('اختیارات این فاز اعمال شده است', 'powers this phase اعمال شده است') : tl('صدور فرمان', 'issue order')}
                                </button>
                              </div>
                            </div>

                            {/* Both Dead emergency Assign Pope (Rule 8) */}
                            {!players.some(p => p.role === 'pope' && p.isAlive) && !players.some(p => p.role === 'priest' && p.isAlive) && (
                              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2 mt-2">
                                <span className="text-[10px] font-black text-rose-400 block mb-1">{tl('⛪ تعیین اضطراری پاپ اعظم جدید (قاعده ۸)', '⛪ set emergency High Pope new (قاعده 8)')}</span>
                                <p className="text-[8.5px] text-slate-400 leading-normal">{tl('رئیس‌جمهور موظف است در فوت همزمان پاپ و کشیش، پاپ جدید را با اولویت شهروند ساده (قاضی و کشیش مجاز نیستند) برگزیند.', 'President موظف است in death همزمان Pope and Priest, Pope new را with اولویت citizen plain (Judge and Priest مجاز نیستند) برگزیند.')}</p>
                                <div className="flex gap-2">
                                  <select
                                    id="president-assign-pope-select"
                                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded p-1 flex-1 focus:outline-none col-span-2 grow"
                                  >
                                    <option value="">{tl('شهروند واجد صلاحیت...', 'citizen واجد صلاحیت...')}</option>
                                    {players
                                      .filter(p => p.isAlive && p.id !== cabinet.presidentId && p.role !== 'judge' && p.role !== 'priest')
                                      .sort((a,b) => {
                                        if (a.role === 'none' && b.role !== 'none') return -1;
                                        if (a.role !== 'none' && b.role === 'none') return 1;
                                        return 0;
                                      })
                                      .map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.role === 'none' ? tl('(اولویت: شهروند ساده)', '(اولویت: citizen plain)') : `(${(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})`}</option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const s = document.getElementById('president-assign-pope-select') as HTMLSelectElement;
                                      if (s && s.value) {
                                        handlePresidentAssignNewPope(s.value);
                                        s.value = '';
                                      } else {
                                        alert(tl('یک بازیکن را برگزینید.', 'a player را choose.'));
                                      }
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-slate-950 text-[10px] font-black px-3 py-1 rounded whitespace-nowrap"
                                  >
                                    {tl('منصوب کن', 'appointed کن')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-950/80 p-4 border border-slate-900 rounded-xl text-center text-slate-500 font-bold text-xs py-5">
                            {tl('رئیس‌جمهور مجمع فوت نموده یا فاقد کرسی می‌باشد.', 'President assembly death نموده or فاقد کرسی می‌باشد.')}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(3)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {tl('برگشت', 'Back')}
                          </button>
                          <button
                            onClick={() => {
                              if (!canProceedFromPresidentStep(true)) {
                                return;
                              }
                              setCurrentDayStep(5);
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>{tl('ورود به گام پنجم: لایحه دفاعیه مجمع', 'enter to step fiveم: لایحه defense assembly')}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: COURT FORMATION & DEFENSE TIMER (نامزدان و دفاعیه دادگاه) */}
                    {currentDayStep === 5 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title={tl("گام ۵ از ۶: ثبت متهمین تالار و لایحه وکیل", "step 5 from 6: record defendantین hall and لایحه Lawyer")} defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            حداکثر ۲ متهم مجمع را ثبت بفرمایید و لایحه ۱ دقیقه‌ای وکیل (برای دفاع یا حمله به متهمین) را شبیه‌سازی کنید.
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const lawyer = players.find(p => p.role === 'lawyer' && p.isAlive && !p.isImprisoned);
                          return lawyer ? (
                            <div className="bg-[#1d273e] border border-[#2b3a5a] text-sky-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>{tl('👤 وکیل مدافع (ایرادکننده لایحه دفاعیه):', '👤 defense Lawyer (ایرادکننده لایحه defense):')}</span>
                              <span className="font-extrabold text-white underline decoration-[#3b5284] underline-offset-2">{lawyer.name}</span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/40 border border-slate-800 text-slate-500 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              ⚠️ وکیل مدافع فعالی در مجمع وجود ندارد (دفاع شخصی متهمین).
                            </div>
                          );
                        })()}

                        {courtExecutedToday && (
                          <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg text-center text-[10.5px] font-bold text-red-400 animate-pulse">
                            {tl('⚠️ تذکر: لایحه حکم نهایی دادگاهِ عالی امروز صادر شده است. هر مجمع بیش از ۱ دادگاه مجاز نیست.', '⚠️ reminder: لایحه verdict نهایی courtِ عالی امday issued شده است. each assembly بیش from 1 court مجاز نیست.')}
                          </div>
                        )}

                        {/* Defense Lawyer Timer */}
                        <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl flex items-center justify-between">
                          <div className="text-right">
                            <span className="block text-[9.5px] text-slate-400 font-bold">{tl('کرونومتر ۶۰ ثانیه وکیل مدافع:', 'کرونومتر 60 ثانیه defense Lawyer:')}</span>
                            <span className="font-mono font-extrabold text-amber-500 text-xs text-right block mt-0.5">{timerCount} ثانیه‌</span>
                          </div>
                          <div className="flex gap-1" dir="ltr">
                            <button
                              onClick={handleToggleTimer}
                              className="text-[10px] font-black bg-[#1d273e] hover:bg-[#2c3a5b] px-3 py-1.5 text-slate-200 rounded-lg cursor-pointer"
                            >
                              {timerRunning ? tl('توقف', 'توقف') : tl('شروع', 'start')}
                            </button>
                            <button
                              onClick={handleResetTimer}
                              className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-400 rounded-lg cursor-pointer"
                            >
                              {tl('ریست', 'reset')}
                            </button>
                          </div>
                        </div>

                        {/* Selected court nominees list */}
                        <div className="space-y-2 mt-2">
                          <span className="block text-[10px] text-slate-300 font-black">متهمین منتخب تالار دادگاه امشب (ظرفیت: {courtSelectedPlayers.length}/۲ نفر):</span>
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900/80 text-xs text-slate-400 space-y-2">
                            {courtSelectedPlayers.length === 0 ? (
                              <span className="text-[10px] text-slate-600 block text-center font-bold">{tl('هیچ متهمی در لیست تالار حضور ندارد.', 'no defendantی in list hall presence lacks.')}</span>
                            ) : (
                              courtSelectedPlayers.map((id) => {
                                const p = players.find((x) => x.id === id);
                                if (!p) return null;
                                return (
                                  <div key={p.id} className="flex items-center justify-between border-b border-slate-900/60 pb-2 last:border-0 last:pb-0">
                                    <span className="font-black text-slate-200">{p.name}</span>
                                    <button
                                      onClick={() => {
                                        setCourtSelectedPlayers((prev) => prev.filter((item) => item !== p.id));
                                        handleLogEvent(tl(`[عفو فوری] عفو خطای دستی ثبت متهم برای «${p.name}» انجام پذیرفت.`, `[pardon فوری] pardon Errorی دستی record defendant بvote "${p.name}" انجام پذیرفت.`), 'system');
                                      }}
                                      className="bg-slate-900 text-slate-300 text-[9px] font-bold px-2 py-1 rounded border border-slate-800 hover:bg-slate-800 transition"
                                      title={tl("لغو ثبت اشتباه", "cancel record اشتباه")}
                                    >
                                      {tl('لغو و بازگشت', 'cancel and بازگشت')}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Manual nomination search-add dropdown */}
                        {!courtExecutedToday && courtSelectedPlayers.length < 2 && (
                          <div className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-400">{tl('ثبت پرونده و ارسال دستی شخص به دادگاه:', 'record case and ارسال دستی شخص to court:')}</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  if (courtSelectedPlayers.includes(e.target.value)) return;
                                  if (courtSelectedPlayers.length >= 2) {
                                    alert(tl('ورودی دادگاه قانوناً بیش از دو نفر نمی‌تواند باشد.', 'enterی court ruleاً بیش from two نفر cannot باشد.'));
                                    e.target.value = '';
                                    return;
                                  }
                                  const targetPl = players.find(p => p.id === e.target.value);
                                  if (targetPl && isRestrictedFromCourt(targetPl)) {
                                    alert(tl('رئیس‌جمهور، پاپ و قاضی مصونیت قضایی دارند و به دادگاه نمی‌روند!', 'President, Pope and Judge مصونیت judicial دارند and to court نمی‌روند!'));
                                    e.target.value = '';
                                    return;
                                  }
                                  setCourtSelectedPlayers([...courtSelectedPlayers, e.target.value]);
                                }
                                e.target.value = '';
                              }}
                              className="w-full bg-[#050810] border border-slate-800 text-xs text-slate-400 rounded-lg p-2 focus:outline-none"
                            >
                              <option value="">{tl('برگزیدن متهم جرمان...', 'choose defendant جرمان...')}</option>
                              {players
                                .filter((p) => p.isAlive && !p.isImprisoned && !courtSelectedPlayers.includes(p.id) && !isRestrictedFromCourt(p))
                                .map((p) => (
                                  <option key={p.id} value={p.id}>{p.name} ({(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})</option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(4)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {tl('برگشت', 'Back')}
                          </button>
                          <button
                            onClick={() => setCurrentDayStep(6)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>{tl('ورود به گام ششم: احکام قاضی', 'enter to step ششم: احکام Judge')}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 6: JUDGE VERDICTS & PRISON HOUSING */}
                    {currentDayStep === 6 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title={tl("گام ۶ از ۶: رای نهایی قاضی، سیاهچال و صیانت پاپ", "step 6 from 6: vote نهایی Judge, سیاهچال and صیانت Pope")} defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            {tl('قاضی تالار مجمع رای نهایی را اعمال می‌سازد. در صورت محکومیتِ اعدام، پاپ اعظم کلیسا می‌تواند آن را به طور زنده وتو کند.', 'Judge assembly hall vote نهایی را اعمال می‌سازد. in صورت محکومیتِ execution, High Pope کلیسا can that را to طور alive veto کند.')}
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const judge = players.find(p => p.role === 'judge' && p.isAlive && !p.isImprisoned);
                          const pope = players.find(p => p.role === 'pope' && p.isAlive && !p.isImprisoned);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl font-bold font-sans flex items-center justify-between">
                                <span>{tl('⚖️ قاضی مجمع (رای نهایی):', '⚖️ Judge assembly (vote نهایی):')}</span>
                                <span className="font-extrabold text-white underline decoration-amber-500/50 underline-offset-2">{judge ? judge.name : tl('فاقد قاضی فعال/زنده', 'فاقد Judge active/alive')}</span>
                              </div>
                              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2.5 rounded-xl font-bold font-sans flex items-center justify-between">
                                <span>{tl('⛪ پاپ اعظم (وتوکننده):', '⛪ High Pope (vetoکننده):')}</span>
                                <span className="font-extrabold text-white underline decoration-indigo-500/50 underline-offset-2">{pope ? pope.name : tl('فاقد پاپ فعال/زنده', 'فاقد Pope active/alive')}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Pope Church Status & Admin Card */}
                        <div className={`p-3 rounded-xl border transition-all duration-300 space-y-2 text-right ${
                          (courtExecutionToVeto || prisonerExecutionToVeto)
                            ? 'bg-amber-955/20 border-amber-500/50 shadow-lg shadow-amber-500/5 animate-pulse'
                            : 'bg-slate-950 border-slate-900'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] text-slate-400 font-bold">{tl('⛪ جایگاه صیانت کلیسایی (پاپ اعظم):', '⛪ position صیانت کلیسایی (High Pope):')}</span>
                            <span className={players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) ? 'text-emerald-400 text-[10px] font-black' : 'text-slate-600 text-[10px] font-black'}>
                              {players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) 
                                ? tl(`زنده و حاکم: «${players.find(p => p.role === 'pope' && p.isAlive && !p.isImprisoned)?.name}»`, `alive and حاکم: "${players.find(p => p.role === 'pope' && p.isAlive && !p.isImprisoned)?.name}"`) 
                                : tl('فاقد پاپ اعظم فعال یا زندانی شده', 'فاقد High Pope active or prisoner شده')}
                            </span>
                          </div>

                          {popeVetoCooldown > 0 ? (
                            <div className="text-[9px] text-amber-500 bg-amber-955/20 border border-amber-900/30 px-2 py-1.5 rounded-lg font-medium leading-relaxed font-sans">
                              ⏳ قابلیت ثبت وتوی پاپ هم‌اکنون در دوره انتظار قانون اعدام یک روز در میان است ({popeVetoCooldown} نوبت استراحت غیاب پاپ).
                            </div>
                          ) : (
                            <div className="text-[9px] text-emerald-450 bg-emerald-955/10 border border-emerald-900/30 px-2 py-1.5 rounded-lg font-medium leading-relaxed font-sans">
                              {tl('📜 منشور وتوی صیانت پاپ تافته و آماده بهره‌برداری است! پاپ در صورت اعدام متهم مجمع یا زندان، به صورت اتوماتیک یا دستی دکمه وتو را فعال دارد.', '📜 منشور veto صیانت Pope تافته and آماده بهره‌برداری است! Pope in صورت execution defendant assembly or prison, to صورت اتوماتیک or دستی button veto را active has.')}
                            </div>
                          )}

                          {/* Inline Veto Option 2: Court Nominee Execution Veto */}
                          {courtExecutionToVeto && (
                            <div className="p-2 bg-rose-955/20 rounded-lg border border-rose-900/40 space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-rose-400 flex items-center gap-1">{tl('⚠️ حکم محکومیت اعدام دادگاه مجمع:', '⚠️ verdict محکومیت execution court assembly:')}</span>
                                <span className="text-rose-400 font-black text-[9px] bg-rose-955/40 border border-rose-900/40 px-1.5 py-0.5 rounded animate-pulse">{tl('آماده دفاع پاپ', 'آماده defense Pope')}</span>
                              </div>
                              <p className="text-[9px] text-slate-350 leading-normal">
                                بازیکن «<strong>{players.find(p => p.id === courtExecutionToVeto)?.name}</strong>» به فرمان دادگاه محکوم به اعدام نهایی شد. پاپ می‌تواند با صدور فرمان صیانت این حکم را ملغی و بازیکن را احیا کند. پس از وتو، قابلیت تروریست در بازی جاری می‌گردد.
                              </p>
                              <button
                                onClick={handleVetoCourtExecution}
                                disabled={popeVetoCooldown > 0 || !players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) || cycleNumber < 1}
                                className={`w-full text-[10px] py-1 font-black rounded transition border ${
                                  popeVetoCooldown > 0 || !players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) || cycleNumber < 1
                                    ? 'bg-slate-900 border-transparent text-slate-655 cursor-not-allowed'
                                    : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                }`}
                              >
                                {popeVetoCooldown > 0 ? tl('وتوی پاپ در دوره انتظار (یک روز در میان) است', 'veto Pope in roundه wait (a day in میان) است') : tl('⛪ وتوی مذهبی پاپ و بازگرداندن متهم به مجمع', '⛪ veto religious Pope and بازگرداندن defendant to assembly')}
                              </button>
                            </div>
                          )}

                          {/* Inline Veto Option 3: Prisoner Execution Veto */}
                          {prisonerExecutionToVeto && (
                            <div className="p-2 bg-rose-955/20 rounded-lg border border-rose-900/40 space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-rose-400 flex items-center gap-1">{tl('⚠️ حکم اعدام زندانی در سیاهچال:', '⚠️ verdict execution prisoner in سیاهچال:')}</span>
                                <span className="text-rose-400 font-black text-[9px] bg-rose-955/40 border border-rose-900/40 px-1.5 py-0.5 rounded animate-pulse">{tl('آماده دفاع پاپ', 'آماده defense Pope')}</span>
                              </div>
                              <p className="text-[9px] text-slate-350 leading-normal">
                                زندانی «<strong>{players.find(p => p.id === prisonerExecutionToVeto)?.name}</strong>» در سیاهچال محکوم به مرگ قطعی شد. پاپ تالار می‌تواند این حکم اعدام را لغو کرده و اجازه دهد او زنده در بند باقی بماند. پس از وتو، قابلیت تروریست در بازی جاری می‌گردد.
                              </p>
                              <button
                                onClick={handleVetoPrisonerExecution}
                                disabled={popeVetoCooldown > 0 || !players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) || cycleNumber < 1}
                                className={`w-full text-[10px] py-1 font-black rounded transition border ${
                                  popeVetoCooldown > 0 || !players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) || cycleNumber < 1
                                    ? 'bg-slate-900 border-transparent text-slate-655 cursor-not-allowed'
                                    : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                }`}
                              >
                                {popeVetoCooldown > 0 ? tl('وتوی پاپ در دوره انتظار (یک روز در میان) است', 'veto Pope in roundه wait (a day in میان) است') : tl('⛪ وتوی مذهبی پاپ و ابطال مرگ زندانی', '⛪ veto religious Pope and ابطال death prisoner')}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Court selected nominees ruling panel */}
                        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                          <span className="block text-[10px] text-slate-300 font-black border-b border-slate-900 pb-1.5 flex items-center gap-1 pb-1">
                            <Scale className="w-4 h-4 text-amber-500" />
                            {tl('صدور حکم حاکمه دادگاه عالی قاضی:', 'issue verdict حاکمه court عالی Judge:')}
                          </span>
                          
                          {courtSelectedPlayers.length === 0 ? (
                            <p className="text-[10px] text-slate-500 text-center py-2 font-bold select-none">{tl('متهم فعالی در تالار دادگاه وجود ندارد.', 'defendant activeی in hall court exists lacks.')}</p>
                          ) : (
                            <div className="space-y-3.5 text-xs text-slate-400">
                              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1.5 text-right">
                                <div className="flex items-center gap-1.5 font-black text-amber-400 text-[10px]">
                                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>{tl('نکته مهم برای گرداننده:', 'نکته important بvote moderator:')}</span>
                                </div>
                                <p className="text-[9.5px] text-slate-300 leading-relaxed font-semibold">
                                  📢 <strong className="text-amber-300 font-extrabold">{tl('ابلاغ قانون مجمع به بازیکنان:', 'ابلاغ rule assembly to players:')}</strong> گرداننده موظف است این فکت را به بازیکنان و متهم بگوید که با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
                                </p>
                              </div>
                              {courtSelectedPlayers.map((id) => {
                                const p = players.find(x => x.id === id);
                                if (!p) return null;
                                return (
                                  <div key={p.id} className="p-2 bg-slate-900/50 rounded-lg border border-slate-800/40 space-y-2">
                                    <span className="font-extrabold text-slate-200 block text-right">{p.name} ⚖️</span>
                                    {courtExecutionToVeto === p.id ? (
                                      <div className="p-2 bg-amber-955/20 border border-amber-900/40 rounded-lg space-y-1 text-right">
                                        <p className="text-[10px] text-rose-450 font-bold leading-normal">{tl('⚠️ این متهم در مجمع امروز محکوم به اعدام شد.', '⚠️ this defendant in assembly امday محکوم to execution شد.')}</p>
                                        <button
                                          onClick={handleVetoCourtExecution}
                                          disabled={popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1}
                                          className={`w-full text-[9px] font-black py-1 rounded transition border ${
                                            popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1
                                              ? 'bg-slate-900 border-transparent text-slate-650 cursor-not-allowed'
                                              : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                          }`}
                                        >
                                          {popeVetoCooldown > 0 ? tl('وتوی پاپ در دوره خنک‌سازی است', 'veto Pope in roundه خنک‌سازی است') : tl('⛪ وتوی مذهبی پاپ و بازگرداندن متهم', '⛪ veto religious Pope and بازگرداندن defendant')}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-3 gap-1" dir="ltr">
                                        <button
                                          onClick={() => handleExecuteVerdict('execute', p.id)}
                                          className="bg-rose-950/80 text-rose-400 text-[9.5px] font-black py-1 px-1.5 rounded border border-rose-900/50 hover:bg-rose-900 transition"
                                        >
                                          {tl('اعدام نهایی', 'execution نهایی')}
                                        </button>
                                        <button
                                          onClick={() => handleExecuteVerdict('jail', p.id)}
                                          className="bg-amber-950/80 text-amber-300 text-[9.5px] font-black py-1 px-1.5 rounded border border-amber-900/50 hover:bg-amber-900 transition"
                                        >
                                          {tl('حبس زندان', 'حبس prison')}
                                        </button>
                                        <button
                                          onClick={() => handleExecuteVerdict('pardon', p.id)}
                                          className="bg-emerald-950/80 text-emerald-400 text-[9.5px] font-black py-1 px-1.5 rounded border border-emerald-900/50 hover:bg-emerald-900 transition"
                                        >
                                          {tl('تبرئه فوری', 'تبرئه فوری')}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Active Imprisoned Players Holding cells */}
                        <div className="bg-slate-950/40 p-3 border border-[#141b2d] rounded-xl space-y-2.5">
                          <div className="flex items-center gap-1.5 justify-between">
                            <h4 className="text-[10px] font-extrabold text-slate-300 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-amber-500" />
                              <span>سلول‌های هلدینگ زندان مجمع ({players.filter(p => p.isAlive && p.isImprisoned).length} از {prisonCapacity} نفر)</span>
                            </h4>
                            <span className="text-[8.5px] font-mono text-slate-500">حداکثر ظرفیت: {prisonCapacity}</span>
                          </div>
                          
                          <p className="text-[8.5px] text-slate-400 leading-normal">
                            مدیریت و حبس موقت! افراد این بند فاقد حق رای مجمع می‌باشند و نقش آن‌ها منحل شده است. قاضی می‌تواند روزانه حداکثر یک نفر را عفو یا اعدام کند (به شرطی که فرد امروز وارد زندان نشده باشد)، اما در صدور این احکام هیچگونه الزامی ندارد و می‌تواند سکوت کند.
                          </p>

                          <div className="bg-slate-955 rounded-lg p-2 border border-slate-900 text-xs space-y-1.5">
                            {players.filter(p => p.isAlive && p.isImprisoned || prisonerExecutionToVeto === p.id).length === 0 ? (
                              <div className="text-center py-2 text-slate-600 font-bold text-[9.5px] select-none">{tl('هیچ شخصی در سلول انفرادی زندان محبوس نیست.', 'no شخصی in cell solitary prison محبوس نیست.')}</div>
                            ) : (
                              players.filter(p => p.isAlive && p.isImprisoned || prisonerExecutionToVeto === p.id).map((p) => (
                                <div key={p.id} className="flex-col border-b border-slate-900/50 pb-1.5 last:border-0 last:pb-0 gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-amber-500 font-sans">{p.name} <span className="text-[8px] text-slate-500 font-normal">{tl('(بدون نقش)', '(without role)')}</span></span>
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle !== cycleNumber && !prisonerVerdictGivenToday && (
                                      <div className="flex gap-1" dir="ltr">
                                        <button
                                          onClick={() => handleExecutePrisonerVerdict(p.id, 'execute')}
                                          className="bg-rose-955 text-rose-400 text-[8px] font-black px-2 py-1 rounded-md border border-rose-900/80 hover:bg-rose-900/20"
                                        >
                                          {tl('اعدام زندانی', 'execution prisoner')}
                                        </button>
                                        <button
                                          onClick={() => handleExecutePrisonerVerdict(p.id, 'pardon')}
                                          className="bg-emerald-955 text-emerald-400 text-[8px] font-black px-2 py-1 rounded-md border border-emerald-900/80 hover:bg-emerald-900/20"
                                        >
                                          {tl('عفو و آزادی', 'pardon and آزادی')}
                                        </button>
                                      </div>
                                    )}
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle !== cycleNumber && prisonerVerdictGivenToday && (
                                      <span className="text-[8px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{tl('حکم امروز صادر شده', 'verdict امday issued شده')}</span>
                                    )}
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle === cycleNumber && (
                                      <span className="text-[8px] font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{tl('جدیدالورود (امروز حکمی دریافت نمی‌کند)', 'newالenter (امday verdictی دریافت نمی‌کند)')}</span>
                                    )}
                                  </div>
                                  {prisonerExecutionToVeto === p.id && (
                                    <div className="p-2 bg-amber-955/20 border border-amber-900/40 rounded-lg mt-1 space-y-1 text-right">
                                      <p className="text-[10px] text-rose-450 font-bold leading-normal">{tl('⚠️ این زندانی اعدام انقلابی شد.', '⚠️ this prisoner execution revolutionی شد.')}</p>
                                      <button
                                        onClick={handleVetoPrisonerExecution}
                                        disabled={popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1}
                                        className={`w-full text-[9px] font-black py-1 rounded transition border ${
                                          popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1
                                            ? 'bg-slate-900 border-transparent text-slate-650 cursor-not-allowed'
                                            : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                        }`}
                                      >
                                        {popeVetoCooldown > 0 ? tl('وتو در خنک‌سازی است', 'veto in خنک‌سازی است') : tl('⛪ وتوی مذهبی پاپ و بازگرداندن به سلول', '⛪ veto religious Pope and بازگرداندن to cell')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(5)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            {tl('برگشت', 'Back')}
                          </button>
                          <button
                            onClick={handleBeginNight}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Moon className="w-4 h-4 text-slate-950" />
                            <span>{tl('پایان فاز روز و رفتن به بستر شب جدید', 'end day phase and رفتن to بستر night new')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 2: LOG LOGS */}
                {selectedTab === 'logs' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                      <h4 className="text-xs font-bold text-slate-200">{tl('صندوق تاریخچه وقایع مجمع', 'صنtwoق تاریخچه وقایع assembly')}</h4>
                      <button
                        onClick={() => {
                          if (logsConfirmActive) {
                            setLogs([]);
                            setLogsConfirmActive(false);
                          } else {
                            setLogsConfirmActive(true);
                            setTimeout(() => setLogsConfirmActive(false), 4000);
                          }
                        }}
                        className={`text-[9.5px] px-2 py-0.5 border rounded transition ${
                          logsConfirmActive
                            ? 'border-rose-900 bg-rose-950/80 text-rose-300 animate-pulse'
                            : 'border-slate-800 bg-slate-905 text-slate-500 hover:text-rose-400'
                        }`}
                      >
                        {logsConfirmActive ? tl('تایید پاک‌سازی؟', 'confirm پاک‌سازی?') : tl('پاک کردن', 'پاک کردن')}
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-[500px] space-y-2 pr-1 custom-scrollbar text-xs">
                      {logs.length === 0 ? (
                        <p className="text-center text-slate-600 py-10">{tl('وقایعی ثبت نگردیده است.', 'وقایعی record نگردیده است.')}</p>
                      ) : (
                        logs.map((log) => {
                          let typeBadgeColor = 'text-slate-400 bg-slate-950';
                          if (log.type === 'kill') typeBadgeColor = 'text-rose-400 bg-rose-950/30 border-rose-900/50';
                          if (log.type === 'protect') typeBadgeColor = 'text-teal-400 bg-teal-950/30 border-teal-900/50';
                          if (log.type === 'block') typeBadgeColor = 'text-yellow-400 bg-yellow-950/30 border-yellow-900/50';
                          if (log.type === 'ability') typeBadgeColor = 'text-purple-400 bg-purple-950/30 border-purple-900/50';
                          if (log.type === 'vote') typeBadgeColor = 'text-amber-400 bg-amber-950/30 border-amber-950/50';

                          return (
                            <div key={log.id} className="p-2 bg-[#050810] border border-[#141b2d] rounded-lg text-right">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-500 font-mono" dir="ltr">{log.timestamp}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${typeBadgeColor}`}>
                                  {log.phase === 'night' ? tl('شب', 'night') : log.phase === 'setup' ? tl('آغاز', 'begin') : tl('روز', 'day')}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">{log.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Moderator Guide Modal */}
      {showModeratorGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full my-auto animate-fadeIn flex justify-center">
            <ModeratorGuide
              key={`mod-${moderatorGuideScrollId ?? 'none'}`}
              onClose={() => { setShowModeratorGuide(false); setModeratorGuideScrollId(undefined); }}
              defaultScrollToId={moderatorGuideScrollId}
            />
          </div>
        </div>
      )}

      {/* Conditions Modal Dialog */}
      <ConditionsModal
        isOpen={showConditionsModal}
        onClose={() => setShowConditionsModal(false)}
        players={players}
        cabinet={cabinet}
        cycleNumber={cycleNumber}
        gamePhase={gamePhase}
        currentDayStep={currentDayStep}
        rolesInPlay={rolesInPlay}
      />

      {/* Developer Panel Control (ONLY displays in dev mode) */}
      {isDevMode && (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2 text-right" dir="rtl">
          {!devPanelOpen ? (
            <button
              onClick={() => setDevPanelOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-2xl border border-amber-300/30 flex items-center gap-1.5 cursor-pointer animate-bounce"
            >
              <Zap className="w-4 h-4 text-slate-950 animate-pulse" />
              منوی سریع شبیه‌ساز توسعه بازی (Dev)
            </button>
          ) : (
            <div className="bg-[#0a0d14]/95 backdrop-blur-md border border-amber-500/35 rounded-2xl p-4 w-[360px] text-right text-slate-100 shadow-2xl animate-fadeIn max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <div className="flex items-center justify-between border-b border-amber-950/20 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-xs font-black text-white">{tl('کنترل‌های دسترسی سریع (دِو)', 'کنترل‌های دسترسی سریع (دِو)')}</span>
                </div>
                <button
                  onClick={() => setDevPanelOpen(false)}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer font-bold"
                >
                  {tl('بستن ×', 'close ×')}
                </button>
              </div>

              <p className="text-[9px] text-slate-400 mb-3 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 leading-relaxed font-semibold">
                {tl('این تابلوی کمکی صرفاً در حوزه توسعه فعال است و با آن بدون پر کردن تک‌تک فرم‌ها می‌توانید به تمامی مراحل و ریزگام‌ها بروید.', 'this تابلوی کمکی صرفاً in حوزه توسعه active است and with that without پر کردن تک‌تک فرم‌ها canید to تمامی مراحل and ریزstep‌ها بروید.')}
              </p>

              <div className="border-b border-slate-900 pb-3 mb-3">
                <span className="text-[10px] font-bold text-slate-400 block mb-2">{tl('تغییر لوگوی برنامه (ذخیره در مروگر):', 'change لوگوی onnameه (ذخیره in مروگر):')}</span>
                <div className="flex gap-2">
                  <label className="flex-1 text-center bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] py-2 rounded-lg font-bold text-amber-500 transition cursor-pointer">
                    {tl('انتخاب تصویر از چت/سیستم', 'select تصویر from چت/سیستم')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result;
                            if (typeof dataUrl === 'string') {
                              setCustomLogo(dataUrl);
                              localStorage.setItem('president_customLogo', dataUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {customLogo && (
                    <button
                      onClick={() => {
                        setCustomLogo(null);
                        localStorage.removeItem('president_customLogo');
                      }}
                      className="px-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-[10px] rounded-lg font-bold text-rose-400 transition cursor-pointer"
                    >
                      {tl('حذف', 'remove')}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* section 1: Main Game Phases */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{tl('۱. فازهای اصلی بازی:', '1. phaseهای اصلی game:')}</span>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    <button
                      onClick={() => handleDevSetupAndJump('setup')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'setup'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      ثبت‌نام (Setup)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('day0')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'day0'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      روز صفر (Day 0)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('night0')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'night0'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      شب صفر (Night 0)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('day')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'day'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      روز عادی (Day)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('night')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'night'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      شب عادی (Night)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('gameover')}
                      className={`p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'gameover'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-950 border-slate-855 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      پایان بازی (GameOver)
                    </button>
                    <button
                      onClick={() => handleDevSetupAndJump('chaos')}
                      className={`col-span-2 p-1.5 rounded-lg font-bold text-center border transition cursor-pointer ${
                        gamePhase === 'chaos'
                          ? 'bg-rose-500 text-white border-rose-400 font-extrabold'
                          : 'bg-slate-950 border-slate-855 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      فاز آشوب شهر (Chaos)
                    </button>
                  </div>
                </div>

                {/* section 2: Day 0 Sub-steps */}
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{tl('۲. گام‌های آغازین روز صفر (Day 0):', '2. step‌های beginین Day Zero (Day 0):')}</span>
                  <div className="grid grid-cols-3 gap-1 text-[8px]">
                    <button
                      onClick={() => handleJumpToDay0Step(1)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۱: خوانش اسرار', '1: خوانش اسرار')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(2)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۲: سر صحبت', '2: سر speak')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(3)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۳: انتخاب پاپ', '3: select Pope')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(4)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۴: انتصاب کشیش', '4: appointment Priest')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(5)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۵: رئیس‌جمهور', '5: President')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(6)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۶: تشکیل کابینه', '6: تشکیل cabinet')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(7)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۷: عزل و نصب معاون', '7: عزل and نصب Vice President')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(8)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۸: انتصاب زیرگروه شهردار', '8: appointment زیرگروه Mayor')}
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(9)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      {tl('۹: قاضی و وکیل', '9: Judge and Lawyer')}
                    </button>
                  </div>
                </div>

                {/* section 3: Night Sub-steps */}
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{tl('۳. گام‌های نوبتی فاز شب (Night Wizard):', '3. step‌های نوبتی night phase (Night Wizard):')}</span>
                  <div className="grid grid-cols-4 gap-1 text-[8px]" dir="rtl">
                    <button
                      onClick={() => handleJumpToNightStep(1)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("مختل‌سازی کشیش", "disrupted‌سازی Priest")}
                    >
                      {tl('۱: کشیش', '1: Priest')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(2)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("پزشک اورژانسی", "پزشک اورژانسی")}
                    >
                      {tl('۲: دکتر', '2: Doctor')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(3)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("انتحار تروریستی", "suicide attack terroristی")}
                    >
                      {tl('۳: تروریست', '3: terrorist')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(4)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("شلیک پلیس", "shot Police")}
                    >
                      {tl('۴: پلیس', '4: Police')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(5)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("جلب پرونده کارآگاه", "جلب case Detective")}
                    >
                      {tl('۵: کارآگاه', '5: Detective')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(6)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("استعلام حقیقت خبرنگار", "inquiry حقیقت Journalist")}
                    >
                      {tl('۶: خبرنگار', '6: Journalist')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(7)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("شلیک ماسون مقتدر", "shot ماسون مقتدر")}
                    >
                      {tl('۷: ماسون', '7: ماسون')}
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(8)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title={tl("ردیابی دوربین گزارشگر", "ردیابی roundبین Reporter")}
                    >
                      {tl('۸: گزارشگر', '8: Reporter')}
                    </button>
                  </div>
                </div>

                {/* section 4: Winner Simulation */}
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{tl('۴. شبیه‌ساز نتیجه پایان بازی:', '4. nightیه‌ساز result end game:')}</span>
                  <div className="grid grid-cols-3 gap-1 text-[8px]">
                    <button
                      onClick={() => {
                        setSimulatedWinner('freemason');
                        setGamePhase('gameover');
                        handleLogEvent(tl('[شبیه‌ساز] پیروزی لژ فراماسون‌ها فعال گردید.', '[nightیه‌ساز] پیdayی Freemason lodge active گردید.'), 'system');
                      }}
                      className={`p-1 rounded font-bold text-center border transition ${
                        simulatedWinner === 'freemason'
                          ? 'bg-rose-500 text-slate-950 border-rose-300'
                          : 'bg-slate-950 border-slate-850 text-rose-300 hover:bg-slate-900'
                      }`}
                    >
                      {tl('برد فراماسون', 'برد Freemason')}
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedWinner('citizen');
                        setGamePhase('gameover');
                        handleLogEvent(tl('[شبیه‌ساز] پیروزی نهضت شهروندان فعال گردید.', '[nightیه‌ساز] پیdayی نهضت citizens active گردید.'), 'system');
                      }}
                      className={`p-1 rounded font-bold text-center border transition ${
                        simulatedWinner === 'citizen'
                          ? 'bg-sky-500 text-slate-950 border-sky-300'
                          : 'bg-slate-950 border-slate-850 text-sky-300 hover:bg-slate-900'
                      }`}
                    >
                      {tl('برد شهروندان', 'برد citizens')}
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedWinner(null);
                        setGamePhase('day');
                        handleLogEvent(tl('[شبیه‌ساز] شبیه‌سازی برد باطل و وضعیت به عادی برگشت.', '[nightیه‌ساز] nightیه‌سازی برد باطل and وضعیت to normal Back.'), 'system');
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition text-slate-100 border border-slate-700 font-bold"
                    >
                      {tl('پاکسازی برد', 'پاکسازی برد')}
                    </button>
                  </div>
                </div>

                {/* section 5: Terrorist Assignment Helper */}
                <div className="border-t border-slate-900 pt-2 text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">{tl('۵. تخصیص و شبیه‌سازی تروریست مجمع:', '5. تخصیص and nightیه‌سازی terrorist assembly:')}</span>
                  <div className="space-y-1 text-[8px] text-right">
                    <button
                      onClick={() => {
                        const eligible = players.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility);
                        if (eligible.length === 0) {
                          alert(tl('هیچ بازیکن زنده و واجد شرایطی جهت دریافت قابلیت تروریست یافت نشد.', 'no player alive and واجد conditionsی جهت دریافت قابلیت terrorist یافت نشد.'));
                          return;
                        }
                        const roleless = eligible.filter((p) => p.role === 'none');
                        const pool = roleless.length > 0 ? roleless : eligible;
                        const chosen = pool[Math.floor(Math.random() * pool.length)];

                        setPlayers((prev) =>
                          prev.map((p) =>
                            p.id === chosen.id ? { ...p, hasTerroristAbility: true, hasTerroristAbilityCycle: cycleNumber + 1 } : p
                          )
                        );
                        handleLogEvent(tl(`[شبیه‌ساز] به دستور دستی توسعه، بازیکن «${chosen.name}» به عنوان تروریست بازی منصوب شد.`, `[nightیه‌ساز] to دستور دستی توسعه, player "${chosen.name}" to عنوان terrorist game appointed شد.`), 'ability');
                      }}
                      className="w-full p-1.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 hover:bg-rose-950/80 transition text-center font-bold"
                    >
                      تخصیص تروریست تصادفی (اولویت فاقد شکل/نقش)
                    </button>
                    <div className="text-[9px] text-slate-400 bg-[#06080f] p-1.5 rounded leading-relaxed border border-slate-900 mt-1">
                      تروریست‌های زنده فعلی:{' '}
                      <span className="text-rose-400 font-black">
                        {players.filter(p => p.hasTerroristAbility && p.isAlive).map(p => p.name).join('، ') || tl('هیچکس', 'no one')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-2.5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">{tl('میانبرها و دستورات سریع:', 'میانبرها and دستورات سریع:')}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setCycleNumber((prev) => Math.max(1, prev - 1));
                        handleLogEvent(tl('[توسعه] تعداد دوره دستی کاهش یافت.', '[توسعه] count roundه دستی کاهش یافت.'), 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      دوره قبلی (-)
                    </button>
                    <button
                      onClick={() => {
                        setCycleNumber((prev) => prev + 1);
                        handleLogEvent(tl('[توسعه] تعداد دوره دستی افزایش یافت.', '[توسعه] count roundه دستی افزایش یافت.'), 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      دوره بعدی (+)
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const defaultNames = [tl('مهرداد', 'Mehrdad'), tl('نیما', 'Nima'), tl('سپیده', 'Sepideh'), tl('آرمان', 'Arman'), tl('صبا', 'Saba'), tl('کیوان', 'Kayvan'), tl('بهار', 'Bahar'), tl('رامین', 'Ramin'), tl('رویا', 'Roya'), tl('سینا', 'Sina')];
                        const assigned = initializePlayers(defaultNames);
                        setPlayers(assigned);
                        handleLogEvent(tl('[توسعه] ۱۰ بازیکن تستی به صورت پیش‌فرض مقداردهی اولیه شدند.', '[توسعه] 10 player تستی to صورت پیش‌فرض مقhasهی اولیه شدند.'), 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      {tl('تولید ۱۰ بازیکن تستی', 'تولید 10 player تستی')}
                    </button>
                    <button
                      onClick={() => {
                        setPlayers([]);
                        setGamePhase('setup');
                        setSelectedTab('guide');
                        setCycleNumber(0);
                        setLogs([]);
                        setCabinet({ presidentId: null, vicePresidentId: null, mayorId: null, judgeId: null });
                        setNightResults(null);
                        setTimerRunning(false);
                        setTimerCount(60);
                        setCourtSelectedPlayers([]);
                        setCourtExecutedToday(false);
                        setPrisonerVerdictGivenToday(false);
                        setCurrentDayStep(1);
                        setPopeVetoCooldown(0);
                        setPresidentSwappedToday(false);
                        setMayorRevoltedToday(false);
                        setPendingPoliceTerrorists(0);
                        setPopeVetoedOnDay0(false);
                        setRevolutionToVeto(null);
                        setCourtExecutionToVeto(null);
                        setPrisonerExecutionToVeto(null);
                        setSimulatedWinner(null);
                        setRolesInPlay([]);
                        setLastNightPriestBlockedId(null);
                        localStorage.clear();
                        handleLogEvent(tl('[توسعه] اطلاعات کل بازی فوراً ریست شد.', '[توسعه] اطلاعات کل game فوراً reset شد.'), 'system');
                      }}
                      className="flex-1 bg-rose-950/20 hover:bg-rose-950/35 border border-rose-900/30 text-rose-400 text-[10px] py-1.5 rounded-lg font-bold text-center transition cursor-pointer"
                    >
                      {tl('ریست دسته‌جمعی آنی', 'reset دسته‌جمعی آنی')}
                    </button>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 text-center select-none pt-1">
                  محیط فعلی: <span className="font-mono text-amber-500 font-bold">{(import.meta as any).env?.DEV ? 'Vite DevServer' : 'Preview Container'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Bottom Footer */}
      {(isAuthenticated && gamePhase) && (
        <footer className="border-t border-amber-950/20 bg-[#0a0d14]/90 backdrop-blur sticky bottom-0 z-40 px-6 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] mt-auto mt-8 flex flex-wrap items-center justify-center gap-4">
          {/* Help & Rules Button (Always Visible) */}
          <button
            onClick={() => setShowRoleGuide(true)}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            {tl('راهنما و قوانین بازی', 'guide and rules game')}
          </button>

          {gamePhase !== 'setup' && (
            <>
              {/* Reset Game Button */}
              <button
                onClick={() => {
                  if (resetConfirmActive) {
                    handleResetGame(true);
                    setResetConfirmActive(false);
                  } else {
                    setResetConfirmActive(true);
                    setTimeout(() => setResetConfirmActive(false), 4000);
                  }
                }}
                className={`border text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  resetConfirmActive
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400'
                }`}
                title={tl("بازی از اول", "game from اول")}
              >
                <RotateCcw className="w-4 h-4" />
                {resetConfirmActive ? tl('تایید شروع مجدد؟ (کلیک دوباره)', 'confirm start مجدد? (کلیک twoباره)') : tl('شروع مجدد', 'start مجدد')}
              </button>

              {/* Secrets reveal mode */}
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  showSecrets
                    ? 'bg-amber-900/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/60'
                    : 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/30'
                }`}
              >
                {showSecrets ? (
                  <>
                    <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
                    اسرار عیان (هویت‌ها نمایان هستند)
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-indigo-400" />
                    حالت عمومی / پروژکتور (برای رویت هویت‌ها کلیک کنید)
                  </>
                )}
              </button>
            </>
          )}
        </footer>
      )}
    </div>
  );
}
