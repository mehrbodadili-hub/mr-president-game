/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Player, RoleType, GamePhase, GameLog, Cabinet, Identity } from './types';
import { initializePlayers, calculateMasonCount, calculatePrisonCapacity, hasInitialShield, generateId, playTimerSound } from './utils';
import { ROLE_DETAILS } from './constants';
import PlayerCard from './components/PlayerCard';
import { CollapsibleGuide } from './components/CollapsibleGuide';
import GameGuide from './components/GameGuide';
import Day0Setup from './components/Day0Setup';
import NightWizard from './components/NightWizard';
import Night0Terrorist from './components/Night0Terrorist';
import ChaosPhase from './components/ChaosPhase';
import SearchManager from './components/SearchManager';
import SpeakingTimer from './components/SpeakingTimer';
import { ConditionsModal } from './components/ConditionsModal';
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
  LogOut
} from 'lucide-react';

const coverImg = new URL('./assets/images/regenerated_image_1780649811869.jpg', import.meta.url).href;

const isDevMode = 
  (import.meta as any).env?.DEV || 
  (typeof window !== 'undefined' && 
   (window.location.hostname === 'localhost' || 
    window.location.hostname.includes('127.0.0.1') || 
    window.location.hostname.includes('ais-dev')));

export default function App() {
  // Game Setup States
  const [playerInput, setPlayerInput] = useState<string>(() => {
    return localStorage.getItem('president_playerInput') || 'مهرداد, نیما, سپیده, آرمان, صبا, کیوان, بهار, رامین, رویا, سینا';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('president_isAuthenticated') === 'true';
  });
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === 'Mehrbod' && authPassword === 'Mehrb@d1366616') {
      setIsAuthenticated(true);
      localStorage.setItem('president_isAuthenticated', 'true');
      setAuthError('');
    } else if (authUsername === 'Said' && authPassword === 'S@id1367') {
      setIsAuthenticated(true);
      localStorage.setItem('president_isAuthenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('نام کاربری یا رمز عبور اشتباه است.');
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
        tiedNames = targetIds.map(id => players.find(p => p.id === id)?.name || 'ناشناس');
        // Randomly choose
        eliminatedId = targetIds[Math.floor(Math.random() * targetIds.length)];
      }

      setChaosModalData({
        isTie,
        tiedNames,
        eliminatedName: players.find(p => p.id === eliminatedId)?.name || 'ناشناس',
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
      handleLogEvent(`💀 به دلیل تساوی آرا بین [${data.tiedNames.join('، ')}]، سیستم به طور تصادفی «${data.eliminatedName}» را هدف قرار داد و حذف کرد.`, 'kill');
    } else {
      handleLogEvent(`💀 بر اساس حداکثر آرای اجباری در فاز آشوب، «${data.eliminatedName}» هدف قرار گرفت و کشته شد.`, 'kill');
    }

    setChaosModalData(null);

    // Wait a tick for gameover win check
    setTimeout(() => {
      if (!simulatedWinner && gamePhase === 'chaos') {
        const remainingActivePlayers = players.filter(p => p.id !== data.eliminatedId && p.isAlive && !p.isImprisoned);
        const shuffled = [...remainingActivePlayers].sort(() => Math.random() - 0.5).map(p => p.id);
        setChaosSpeakerOrder(shuffled);
        setChaosVotes({});
        handleLogEvent(`نبرد آشوب ادامه دارد... رأی‌گیری مجدد آغار شد.`, 'system');
      }
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthUsername('');
    setAuthPassword('');
    localStorage.removeItem('president_isAuthenticated');
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
  const [selectedTab, setSelectedTab] = useState<'day' | 'logs'>(() => {
    return (localStorage.getItem('president_selectedTab') as 'day' | 'logs') || 'day';
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
  const [guideDefaultMode, setGuideDefaultMode] = useState<'players' | 'moderator' | 'roles'>('players');
  const [guideDefaultSearch, setGuideDefaultSearch] = useState('');
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
          `🚨 مجمع اضطراری آشوب دایر گردید! شمار بازماندگان فعال مجمع به لایحه اضطراریِ ${chaosThreshold} نفر رسید. زندانیان از بازی حذف و کلیه حقوق مدنی باطل شدند. فاز آشوب مستقر گردید!`,
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
          `🚨 جانشینی مقام ریاست جمهوری! با شهادت رئیس‌جمهور، معاون ایشان «${vp.name}» رسماً به عنوان رئیس‌جمهور جدید مجمع سوگند یاد کرد.`,
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
          `🚨 جانشینی اضطراری ریاست جمهوری! با فوت رئیس‌جمهور و معاون مجمع، شهردار مقتدر «${mayor.name}» عهده‌دار کرسی ریاست جمهوری گردید.`,
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
          `🚨 انتصاب اضطراری و تصادفی ریاست جمهوری! به علت فوت کادر ارشد مجمع، قرعه حاکمیت مجمع به صورت رندوم به نام بازیکن «${randomPlayer.name}» درآمد.`,
          'system'
        );
      } else {
        handleLogEvent(
          `⚠️ فروپاشی حاکمیت اجرایی مجمع! کادر ارشد مجمع اعم از رئیس‌جمهور، معاون، شهردار تماماً مرده‌اند. به علت حفظ تفکیک قوا، امکان انتصاب پاپ، کشیش، قاضی یا زندانی در جایگاه ریاست‌جمهوری نیست. مجمع بدون قوه مجریه می‌ماند!`,
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
        `🚨 جانشینی عالی پاپ اعظم! با فقدان پاپ اعظم، کشیشِ مجمع «${priest.name}» ردای سرخ پاپ اعظم را به دوش افکند.`,
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
      const defaultNames = ['مهرداد', 'نیما', 'سپیده', 'آرمان', 'صبا', 'کیوان', 'بهار', 'رامین', 'رویا', 'سینا'];
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
      targetPhase === 'setup' ? 'ثبت‌نام' :
      targetPhase === 'day0' ? 'روز صفر' :
      targetPhase === 'night0' ? 'شب صفر' :
      targetPhase === 'day' ? 'روز' :
      targetPhase === 'chaos' ? 'آشوب' : 'شب'
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
    if (force || !window.confirm || confirm('آیا مایلید این بازی را ریست کرده و بازی جدیدی شروع کنید؟')) {
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
      alert('بازی آقای رئیس‌جمهور حداقل نیاز به ۸ بازیکن دارد و برای تعداد کمتر مجمع رسمی تشکیل نمی‌شود.');
      return;
    }
    if (names.length > 30) {
      alert('تعداد بازیکنان مجمع حاکمیتی جهت پایداری و ثبات قوانین نباید بیش از ۳۰ نفر باشد.');
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
    const customLogMsg = `بازی با حضور ${names.length} بازیکن آغاز شد. ${masonCount} فراماسون (بر پایه حد نصاب قانونی ۲۹٪) به طور مخفیانه وارد لژ شدند.`;
    
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
              `[وتوی پاپ اعظم] به واسطه حق ابطال تصمیمات مجمع توسط پاپ اعظم بر صندلی ریاست‌جمهوری، هسته‌های خشونت‌امیز فعال شدند! بازیکن «${chosen.name}» به صورت کاملاً پنهانی به عنوان «تروریست مجمع» انتصاب گردید.`,
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
        isVetoed ? ' (توجه: حق وتوی پاپ اعظم فعال شده و تروریست مخفی گمارده شد)' : ''
      }`,
      'system'
    );
  };

  // Begin regular Day cycle
  const handleStartDay1 = () => {
    setGamePhase('day');
    setSelectedTab('day');
    handleLogEvent(`شب صفر به پایان رسید. خرق فجر! وارد روز اول بازی می‌شویم. گفتگو آزاد آغاز می‌گردد.`, 'system');
  };

  // Player action handlers
  const handleUpdatePlayerRole = (id: string, newRole: RoleType) => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;

    // Log the stripped role change if someone already has it
    if (newRole !== 'none') {
      const existingHolder = players.find(p => p.role === newRole && p.id !== id);
      if (existingHolder) {
        handleLogEvent(`سمتِ «${ROLE_DETAILS[newRole].nameFa}» از بازیکن ${existingHolder.name} سلب شد.`, 'system');
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

    handleLogEvent(`جایگاه نقش بازیکن «${targetPlayer.name}» به «${ROLE_DETAILS[newRole].nameFa}» ارتقا یافت.`, 'system');
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

    const identityName = newIdentity === 'freemason' ? 'فراماسون' : 'شهروند ساده';
    handleLogEvent(`هویت اصلی بازیکن «${targetPlayer.name}» به «${identityName}» تغییر یافت.`, 'system');
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
    handleLogEvent(`بازیکن جدید «${name}» با موفقیت به بازی دعوت شد.`, 'system');
  };

  const handleRemovePlayer = (id: string) => {
    const targetPlayer = players.find(p => p.id === id);
    if (!targetPlayer) return;
    setPlayers((prev) => prev.filter(p => p.id !== id));
    handleLogEvent(`بازیکن «${targetPlayer.name}» از مجمع بازی حذف شد.`, 'system');
  };

  const handleTogglePlayerAlive = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.isAlive;
          handleLogEvent(`بازیکن «${p.name}» ${nextState ? 'زنده شد و به جریان بازی بازگشت.' : 'مرد و به خاک سپرده شد.'}`, nextState ? 'system' : 'kill');
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
      alert('ظرفیت قانونی زندان قاضی حداکثر ۳ نفر است و هم‌اینک کاملاً پر می‌باشد!');
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextState = !p.isImprisoned;
          handleLogEvent(
            `بازیکن «${p.name}» توسط دادرسی قاضی ${nextState ? 'به سلول انفرادی زندان منتقل و حق رای او تعلیق شد.' : 'از بند زندان آزاد شد.'}`,
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
            `سپر امنیتی بازیکن «${p.name}» توسط گرداننده ${hadActiveShield ? 'باطل شد.' : 'شارژ و فعال گردید.'}`,
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
            `گرداننده قابلیت بمب تروریست را برای «${p.name}» ${nextState ? 'فعال کرد.' : 'غیر فعال نمود.'}`,
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
        alert('⚠️ نقش خالی قاضی تالار مجمع الزامی است! رئیس‌جمهور باید ابتدا جانشین قاضی مقتول را تعیین تکلیف کند.');
      }
      return false;
    }

    if (vacantRoles.includes('mayor')) {
      if (showFeedback) {
        alert('⚠️ نقش خالی شهردار الزامی است! رئیس‌جمهور باید جانشین شهردار را تعیین تکلیف کند.');
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
          alert('⚠️ رئیس‌جمهور موظف است نقش‌های خالی مجمع را با شهروندان بدون نقش جایگزین کند. لطفاً ابتدا نقش یا نقش‌های خالی را واگذار بفرمایید.');
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
      alert('لطفاً یک بازیکن زنده را به عنوان کشیش جدید انتخاب فرمایید.');
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
      `پاپ مقتدر با صدور فرمان معنوی، بازیکن زنده «${nominee.name}» را به مقام کشیش جدید مجمع منصوب فرمود.`,
      'system'
    );
  };

  // President Assign New Pope when both are dead (Rule 5)
  const handlePresidentAssignNewPope = (newPopeId: string) => {
    const nominee = players.find((p) => p.id === newPopeId);
    if (!nominee || !nominee.isAlive) {
      alert('لطفاً یک بازیکن زنده جهت جانشینی مقام پاپ انتخاب نمایید.');
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
      `به دلیل فوت همزمان پاپ و کشیش، رئیس‌جمهور مجمع بازیکن زنده «${nominee.name}» را به مقام پاپ اعظم منصوب نمود.`,
      'system'
    );
  };

  const handleManualAssignPresident = (newPresidentId: string, assignerName: string) => {
    const nominee = players.find(p => p.id === newPresidentId);
    if (!nominee || !nominee.isAlive) {
      alert('لطفاً یک بازیکن زنده برگزینید.');
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
    handleLogEvent(`🚨 تعیین ریاست جمهوری جدید! با غیاب رئیس‌جمهور و فوت معاونان، به فرمان عالیِ ${assignerName}، بازیکن زنده «${nominee.name}» به کرسی ریاست منصوب شد.`, 'system');
  };

  // President Fill Vacant Role (Rule 3 priority and Vacant Judge Priority)
  const handlePresidentFillVacantRole = (pId: string, role: RoleType) => {
    if (presidentSwappedToday) {
      const vacantRoles = getVacantRoles();
      if (!vacantRoles.includes(role)) {
        alert('رئیس‌جمهور قبلاً قابلیت جابه‌جایی/پر کردن نقش‌های خود را در این فاز روز خرج کرده است.');
        return;
      }
    }
    const valPlayer = players.find((p) => p.id === pId);
    if (!valPlayer || !valPlayer.isAlive) {
      alert('لطفاً یک بازیکن زنده برگزینید.');
      return;
    }

    const vacantRoles = getVacantRoles();
    if (!vacantRoles.includes(role)) {
      alert('این نقش هم‌اکنون خالی نیست یا در بازی وجود ندارد.');
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
    const oldRoleMsg = oldRoleOfPlayer !== 'none' ? `دارای منصب والای «${ROLE_DETAILS[oldRoleOfPlayer].nameFa}»` : 'بدون منصب';
    handleLogEvent(
      `رئیس‌جمهور نقش خالیِ «${ROLE_DETAILS[role].nameFa}» را به شهروند زنده ${oldRoleMsg} به نام «${valPlayer.name}» تفویض نمود.`,
      'ability'
    );
  };

  // President role Swap
  const handlePresidentSwapRoles = (p1Id: string, p2Id: string) => {
    if (presidentSwappedToday) {
      alert('رئیس‌جمهور قبلاً قابلیت جابه‌جایی نقش‌های خود را در این فاز روز خرج کرده است.');
      return;
    }

    const p1 = players.find((p) => p.id === p1Id);
    const p2 = players.find((p) => p.id === p2Id);

    if (!p1 || !p2 || p1Id === p2Id) {
      alert('لطفاً دو بازیکن متمایز را جهت تعویض نقش برگزینید.');
      return;
    }

    const r1 = p1.role;
    const r2 = p2.role;

    // We do not swap the president's own role!
    if (r1 === 'president' || r2 === 'president') {
      alert('رئیس‌جمهور نمی‌تواند نقش خودش را با شخص دیگری جایگزین کند.');
      return;
    }

    const vacantRolesInSwap = getVacantRoles().filter(r => r !== 'priest' && r !== 'pope');

    // Role 2 and roleless priorities (Rule 2 and Rule 3)
    if (r1 === 'pope' || r2 === 'pope' || r1 === 'priest' || r2 === 'priest') {
      alert('رئیس‌جمهور مجاز به تغییر یا تعویض نقش‌های مقدس پاپ و کشیش نمی‌باشد.');
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
      `ریاست جمهوری فرمان عالی جابه‌جایی را امضا کرد: نقش‌های «${p1.name}» (${ROLE_DETAILS[r1].nameFa}) و «${p2.name}» (${ROLE_DETAILS[r2].nameFa}) با یکدیگر معاوضه گشتند.`,
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
      handleLogEvent(`به جهت ابطال تصمیمات قانونی مجمع توسط پاپ مصلح، قابلیت تروریست تصادفی جدید به بازیکن «${chosen.name}» اهدا شد.`, 'ability');
    }
  };

  const handleVetoRevolution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.');
      return;
    }
    if (popeVetoCooldown > 0) {
      alert('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.');
      return;
    }
    if (!revolutionToVeto) {
      alert('هیچ انقلاب موفقی امروز رخ نداده است تا وتو شود.');
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
      `کلیسای پاپ دخالت کرد! پاپ اعظم مجمع لایحه انقلاب شهردار را باطل اعلام نمود. مقام رئیس‌جمهور و شهردار به جایگاه پیشین خود بازگشتند.`,
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setRevolutionToVeto(null);
  };

  const handleVetoCourtExecution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.');
      return;
    }
    if (popeVetoCooldown > 0) {
      alert('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.');
      return;
    }
    if (!courtExecutionToVeto) {
      alert('هیچ رای اعدام دادگاهی امروز صادر نشده است تا وتو شود.');
      return;
    }

    const target = players.find((p) => p.id === courtExecutionToVeto);
    if (!target) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === courtExecutionToVeto ? { ...p, isAlive: true } : p))
    );

    handleLogEvent(
      `کلیسای پاپ دخالت کرد! حکم اعدام اعلام شده قاضی دادگاه برای بازیکن «${target.name}» توسط پاپ اعظم ابطال و متهم بخشیده شد.`,
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setCourtExecutionToVeto(null);
  };

  const handleVetoPrisonerExecution = () => {
    if (cycleNumber < 1 || gamePhase !== 'day') {
      alert('وتوی پاپ فقط از روز اول به بعد در فاز گفتگو فعال است.');
      return;
    }
    if (popeVetoCooldown > 0) {
      alert('وتوی پاپ در دوره خنک‌سازی (یک روز در میان) به سر می‌برد.');
      return;
    }
    if (!prisonerExecutionToVeto) {
      alert('هیچ رای اعدام زندانی امروز صادر نشده است تا وتو شود.');
      return;
    }

    const target = players.find((p) => p.id === prisonerExecutionToVeto);
    if (!target) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === prisonerExecutionToVeto ? { ...p, isAlive: true, isImprisoned: true } : p))
    );

    handleLogEvent(
      `کلیسای پاپ دخالت کرد! حکم اعدام زندانیِ بندِ تالار «${target.name}» توسط پاپ اعظم ابطال گردید و ایشان در سلول زنده باقی ماند.`,
      'ability'
    );

    addRandomTerroristOnVeto();
    setPopeVetoCooldown(2);
    setPrisonerExecutionToVeto(null);
  };

  // Mayor Revolution
  const handleMayorRevolution = (success: boolean) => {
    if (mayorRevoltedToday) {
      alert('شهردار قبلاً در این دوره درخواست ائتلاف یا کودتا داده است.');
      return;
    }

    const president = players.find((p) => p.role === 'president');
    const mayor = players.find((p) => p.role === 'mayor');

    if (!president || !mayor) {
      alert('رئیس‌جمهور یا شهردار در حیات قانونی نیستند تا مجمع انقلاب شکل گیرد.');
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
        `کودتای بهار! شهردار «${mayor.name}» با موفقیت رئیس‌جمهور «${president.name}» را خلع کرد و رئیس‌جمهور جدید شد. رئیس سابق خلع سلاح گردید و به عنوان متهم به دادگاه معرفی شد!`,
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
        `انقلاب شهرداری شکست خورد! بازیکن «${mayor.name}» لایسنس شهرداری را از دست داد و به تالار متهمین دادگاه (ورودی دادگاه) معرفی شد.`,
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
      handleLogEvent(`به سبب هرج‌ومرج ناشی از انقلاب در مجمع، بمب و توانایی تروریست تصادفی جدید به بازیکن «${chosen.name}» منتقل شد.`, 'ability');
    }
  };

  // Execute verdict on an already imprisoned player (pardon or execute) - Rule 9
  const handleExecutePrisonerVerdict = (targetId: string, verdict: 'pardon' | 'execute') => {
    if (prisonerVerdictGivenToday) {
      alert('قاضی امروز پیش‌تر یک حکم (اعدام یا عفو) برای زندانی‌ها صادر کرده است. هر روز فقط یک حکم برای زندان قابل صدور است.');
      return;
    }

    const target = players.find((p) => p.id === targetId);
    if (!target || !target.isImprisoned) return;

    if (target.imprisonedAtCycle === cycleNumber) {
      alert('این شخص به تازگی (همین امروز) به زندان افتاده است و نمی‌توان امروز برای او حکمی صادر کرد.');
      return;
    }

    setPrisonerVerdictGivenToday(true);

    if (verdict === 'pardon') {
      setPlayers((prev) => prev.map((p) => (p.id === targetId ? { ...p, isImprisoned: false } : p)));
      handleLogEvent(`فرمان عفو قاضی! زندانیِ بندِ تالار «${target.name}» مورد عفو واقع شد و آزاد گردید.`, 'system');
    } else if (verdict === 'execute') {
      setPlayers((prev) => prev.map((p) => (p.id === targetId ? { ...p, isAlive: false, isImprisoned: false } : p)));
      setPrisonerExecutionToVeto(targetId);
      handleLogEvent(`اعدام انقلابی در بند! حکم مرگ قطعی زندانیِ غائب «${target.name}» صادر گردید و گیوتین فرود آمد.`, 'kill');
    }
  };

  // Collective pardon for court nominees
  const handlePardonAllNominees = () => {
    courtSelectedPlayers.forEach((id) => {
      const p = players.find((x) => x.id === id);
      if (p) {
        handleLogEvent(`فرمان عفو دسته‌جمعی قاضی! متهم مجمع «${p.name}» با موفقیت بخشیده شد.`, 'system');
      }
    });
    setCourtSelectedPlayers([]);
  };

  // Judge Verdict execution
  const handleExecuteVerdict = (verdict: 'pardon' | 'jail' | 'execute', targetId: string) => {
    const target = players.find((p) => p.id === targetId);
    if (!target) return;

    if (verdict === 'pardon') {
      handleLogEvent(`قاضی دادگاه حکم تبرئه تام‌الاختیار بازیکن «${target.name}» را صادر کرد.`, 'system');
      // Remove only this person from nominees
      setCourtSelectedPlayers((prev) => prev.filter((id) => id !== targetId));
    } else if (verdict === 'jail') {
      const currentPrisCount = players.filter((p) => p.isImprisoned && p.id !== targetId && p.isAlive).length;
      if (currentPrisCount >= prisonCapacity) {
        alert(`امکان زندانی کردن متهم وجود ندارد! ظرفیت سلول زندان قاضی (${prisonCapacity} نفر) کاملاً تکمیله.`);
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
      handleLogEvent(`محکمه زندان! قاضی، بازیکن «${target.name}» را راهی بند صغیر زندان کشید و سمت او منحل گشت.`, 'system');

      // Auto-pardon alternative nominee (only one person can get sentenced!)
      const others = courtSelectedPlayers.filter((id) => id !== targetId);
      others.forEach((id) => {
        const p = players.find((x) => x.id === id);
        if (p) {
          handleLogEvent(`به جهت صدور حکم بر متهم دیگر، بازیکن «${p.name}» مشمول عفو مستمر گردید و آزاد شد.`, 'system');
        }
      });
      setCourtSelectedPlayers([]);
    } else if (verdict === 'execute') {
      setPlayers((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, isAlive: false } : p))
      );
      setCourtExecutionToVeto(targetId);
      setCourtExecutedToday(true);
      handleLogEvent(`حکم اعدام! گیوتین بر گلوی بازیکن «${target.name}» فرود آمد.`, 'kill');

      // Auto-pardon alternative nominee
      const others = courtSelectedPlayers.filter((id) => id !== targetId);
      others.forEach((id) => {
        const p = players.find((x) => x.id === id);
        if (p) {
          handleLogEvent(`به جهت صدور حکم بر متهم دیگر، بازیکن «${p.name}» مشمول عفو مستمر گردید و آزاد شد.`, 'system');
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
          handleLogEvent(`زمان استفاده از بمب به پایان رسید؛ قابلیت انتحاری تروریست برای «${p.name}» ابطال و ملغا گردید.`, 'system');
        }, 50);
      }
      
      // Assign new police terrorist abilities that span tonight and tomorrow
      if (newlyAssignedTerrorists.includes(p.id)) {
        hasTerroristAbility = true;
        hasTerroristAbilityCycle = cycleNumber + 1;
        setTimeout(() => {
          handleLogEvent(`به واسطه خشونت و آثار شلیک پلیس در شب گذشته، قابلیت تروریست (با مهلت امشب و فردا روز) مخفیانه به بازیکن «${p.name}» منتقل گردید.`, 'ability');
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
    handleLogEvent(`آفتاب غروب کرد! فاز گفتگو بسته شد و مأموریت خطیر شبانه دور ${cycleNumber} آغاز می‌شود.`, 'system');
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
        handleLogEvent(`تک‌تیرانداز پلیس امشب شات خود را خالی کرد؛ قابلیت ترور ناشی از این خشونت در شروع شب بعد به یک تروریست واگذار خواهد شد.`, 'system');
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

    handleLogEvent(`بیدارباش! خورشید دور جدید فروزان شد. نتایج رویدادهای شب گذشته بروی تابلوی اعلانات قرار گرفت.`, 'system');
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
      <div className="min-h-screen bg-[#050609] text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-amber-500 selection:text-slate-900 overflow-hidden relative" dir="rtl">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md mx-auto z-10 px-6 animate-fadeIn">
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
                سناریوی رئیس‌جمهور
              </h1>
              <p className="text-sm font-semibold text-amber-500/70 mt-3 font-sans tracking-wide">
                پنل مدیریت جامع و شب‌خوانی
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {authError && (
                <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs p-3 rounded-xl text-center font-bold">
                  {authError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 mr-1 block" htmlFor="username">نام کاربری</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#050609] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500/50 transition pl-10"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 mr-1 block" htmlFor="password">رمز عبور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#050609] border border-slate-800 text-sm text-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500/50 transition pl-10"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black text-sm py-3.5 rounded-xl transition shadow-lg shadow-amber-900/20 mt-4 flex items-center justify-center gap-2"
              >
                ورود به پنل مدیریت
              </button>
            </form>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="fixed bottom-4 left-4 text-[10px] text-slate-600 font-bold tracking-wider z-20">
          طراحی و توسعه توسط مهربد عدیلی و سعید نوری
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900 overflow-x-hidden" dir="rtl">
      {/* Top Main Navigation Bar */}
      <header className="border-b border-amber-950/20 bg-[#0a0d14]/90 backdrop-blur sticky top-0 z-40 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-400/30 overflow-hidden shrink-0 bg-black">
              <img src={coverImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 id="app-title" className="text-lg font-black text-white tracking-wide gold-glow-text">سناریویِ آقای رئیس‌جمهور</h1>
              <p className="text-[10px] text-amber-500/80 font-bold tracking-tight">سامانه مدیریت و دستیار هوشمندِ گرداننده لژ</p>
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
                  سخت‌گیرانه
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
                  کنترل‌شده
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
                  خلاقانه
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>

            {/* Help & Rules Button and other controls have been moved to Footer */}
            {gamePhase !== 'setup' && (
              <>
                {/* Phase badge */}
                <span className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-bold font-mono">
                  {gamePhase === 'day0' && 'روز صفر'}
                  {gamePhase === 'night0' && 'شب صفر'}
                  {gamePhase === 'day' && `روز ${cycleNumber}`}
                  {gamePhase === 'night' && `شب ${cycleNumber}`}
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
          <span className="opacity-70 font-black">قانون حاکم:</span>
          {executionMode === 'STRICT' && (
            <span>«اگر گفته نشده، وجود ندارد». هرگونه خلاقیت یا امکانات ناخواسته‌ای غیرفعال و ممنوع است.</span>
          )}
          {executionMode === 'CONTROLLED' && (
            <span>تنها گزینه‌های تاییدشده و توسعه محدود مجاز است. هر نوع نوآوری مستقل به تایید نیاز دارد.</span>
          )}
          {executionMode === 'CREATIVE' && (
            <span>ایده‌پردازی و ایجاد گزینه‌های آزمایشی نوآورانه آزاد است.</span>
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
                 نتیجه رأی‌گیری اجباری شهر
               </h2>
               <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-6">
                 {chaosModalData.isTie ? (
                   <>
                     <p className="text-sm font-bold text-amber-500 mb-2">تساوی آرا بین بازیکنان:</p>
                     <p className="text-sm text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                       {chaosModalData.tiedNames.join('، ')}
                     </p>
                     <p className="text-xs text-rose-400 font-bold mb-1">قرعه مرگ از سمت سیستم برای:</p>
                     <p className="text-xl font-black text-white">{chaosModalData.eliminatedName}</p>
                   </>
                 ) : (
                   <>
                     <p className="text-xs text-rose-400 font-bold mb-1">فرد انتخاب شده جهت خروج اجباری:</p>
                     <p className="text-xl font-black text-white mb-2">{chaosModalData.eliminatedName}</p>
                   </>
                 )}
               </div>
               <button
                 onClick={handleApplyChaosResult}
                 className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition"
               >
                 اعمال حذف و ادامه
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
                {winStatus === 'freemason' ? 'پیدایش نظم نوین: فراماسون‌ها پیروز شدند!' : 'عدالت الهی: شهروندان پیروز شدند!'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                {winStatus === 'freemason'
                  ? 'برابری آرای غاصبانه برقرار شد. فراماسون‌های مقتدر توانستند ارکان دولت و ریاست جمهوری را در این نبرد سیاسی تصاحب کنند.'
                  : 'تلاش‌ها ثمر داد. آخرین نطفه نفوذی‌های فراماسونری توسط قانون قوی و آگاهی مدنی شهر کشف، زندانی یا تیرباران گردید.'}
              </p>

              <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl mb-6 text-right">
                <h4 className="text-xs font-bold text-slate-300 mb-2">وضعیت زنده مانده‌ها:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {players.filter(p => p.isAlive).map(p => (
                    <div key={p.id} className="flex justify-between p-1.5 border-b border-slate-900 text-slate-400">
                      <span>{p.name}</span>
                      <span className={p.identity === 'freemason' ? 'text-rose-400' : 'text-sky-400 font-semibold'}>
                        {p.identity === 'freemason' ? 'فراماسون' : 'شهروند'} ({(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleResetGame(true)}
                className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-amber-600/10"
              >
                راهبری و شروع بازی مجدد
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

            <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-1 tracking-tight">آماده‌سازی لژ و مجمع آغازین</h2>
            <p className="text-xs text-slate-400 text-center mb-6">
              جهت تقسیم هویت‌های ۲۹ درصدی و سازمان‌دهی لژ فراماسونری، اسامی بازیکنان مجمع را وارد نمایید.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-500/80 mb-2">اسامی بازیکنان مجمع (جداشده با ویرگول فارسی «،»):</label>
                <textarea
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#04060a] text-slate-100 border border-slate-800 focus:border-amber-500 rounded-xl p-4 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-right"
                  placeholder="مثال: مهرداد، نیما، سپیده، آرمان، صبا، کیوان، بهار، رامین، رویا، سینا..."
                />
              </div>

              {/* Informational Box on Masons Calculation */}
              <div className="bg-[#0e121b] border border-amber-950/20 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  محاسبه قانونی حد نصاب مجمع (۲۹٪):
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed text-right">
                  طبق پیوست اساس‌نامه مجمع، تعداد اعضای لژ فراماسونری دقیقاً ۲۹ درصد کل جمعیت مجمع خواهد بود. اعداد اعشاری برتر از ۰.۵۰ رو به بالا و کمتر رو به پایین گرد می‌شوند.
                </p>
                <div className="mt-3 text-xs font-semibold text-slate-300 bg-[#04060a] p-2.5 rounded-lg border border-slate-900 flex justify-between items-center">
                  <span>تعداد اعضای مخفی لژ با این جمعیت:</span>
                  <span className="text-rose-400 bg-rose-950/30 border border-rose-900/40 px-2.5 py-0.5 rounded font-mono font-bold">
                    {calculateMasonCount(
                      playerInput
                        .split(/[,،]/)
                        .map((n) => n.trim())
                        .filter((n) => n.length > 0).length
                    )}{' '}
                    نفر فراماسون
                  </span>
                </div>
              </div>

              {/* Collapsible Rules and Demographic Requirements */}
              <div className="space-y-2">
                <CollapsibleGuide title="قوانین توازن و الزامات جمعیتی (الزامات شروع مجمع)" defaultOpen={false}>
                  <div className="space-y-3 pt-2 text-right text-xs text-slate-400 leading-relaxed font-sans" dir="rtl">
                    <p className="font-semibold text-slate-300">
                      قوانین و حضور نقش‌ها در مجمع بر اساس <strong className="text-amber-500">تعداد بازیکنان در شروع بازی</strong> تنظیم شده و هرگونه تغییر جمعیت در حین بازی تأثیری بر این مسئولیت‌ها نخواهد گذاشت:
                    </p>
                    
                    <div className="space-y-2.5">
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">👥 جمعیت ۸ تا ۱۱ نفر:</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>حق رای معاون اول ملغی و به ۱ رای تقلیل می‌یابد.</li>
                          <li>نقش <strong className="text-slate-200">پلیس مسلح</strong> به‌طور کامل از مجمع حذف می‌شود.</li>
                        </ul>
                      </div>

                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">👥 جمعیت ۸ و ۹ نفر:</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>نقش <strong className="text-slate-200">معاون اول</strong> حذف گردیده و فرآیند انتصاب رده‌های تحت امر وی (خبرنگار و گزارشگر) مستقیماً توسط خود <strong className="text-slate-200">رئیس‌جمهور</strong> در فاز روز صفر صورت می‌گیرد.</li>
                          <li>نقش <strong className="text-slate-200">کشیش</strong> به‌طور کامل از بازی حذف گردیده و شب صفر او نادیده گرفته می‌شود.</li>
                        </ul>
                      </div>

                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                        <span className="font-black text-teal-400 block mb-0.5">👥 جمعیت ۸ نفر:</span>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-400 pr-1">
                          <li>نقش <strong className="text-slate-200">وکیل مدافع</strong> حذف شده و انتصابی برای آن صورت نخواهد پذیرفت.</li>
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
                توزیع قرعه و شروع سناریوی مجمع
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
            <h2 className="text-xl font-black text-rose-400 mb-2">سکوت محض! بیدارباش شب صفر</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              هم‌اینک گرداننده فرمان بیدار شدن را به فراماسون‌های بازی می‌دهد.
              آن‌ها به مدت ۳۰ ثانیه معارفه و به چشمان یکدیگر نگاه می‌کنند تا هم‌رزمان خود در شهر را شناسایی کنند.
            </p>

            <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl mb-6 text-right">
              <h4 className="text-xs font-bold text-rose-300 mb-2">اسامی لژ فراماسونری امشب:</h4>
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
              پایان شب صفر و اعلام آغاز صبح اول
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
                      وضعیت پکیج جاری: {gamePhase === 'chaos' ? 'مرحله اضطراری آشوب شهر' : gamePhase === 'day' ? 'فاز روز دگردیسی گفتگو' : 'فاز خواب و عملیات‌های شبانه'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      تعداد فعال و زنده مجمع: {players.filter((p) => p.isAlive && !p.isImprisoned).length} نفر | فراماسون‌های آزاد زنده: {players.filter((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned).length} نفر
                    </p>
                  </div>
                </div>

                {gamePhase === 'chaos' ? (
                  <div className="text-xs text-rose-400 font-bold bg-rose-955/20 px-3 py-1.5 border border-rose-900/40 rounded-lg animate-pulse">
                    شهر در وضعیت آشوب قرار دارد
                  </div>
                ) : gamePhase === 'day' ? (
                  <button
                    onClick={handleBeginNight}
                    className="bg-indigo-955/20 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/20 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    گذراندن روز و بستن مجمـع
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
                    onNavigateToGuide={(roleType, roleNameFa) => {
                      setGuideDefaultMode('roles');
                      setGuideDefaultSearch(roleNameFa);
                      setShowRoleGuide(true);
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
                      تایید و بستن جدول
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Deaths */}
                    <div>
                      <span className="font-bold text-slate-300">کشته‌شدگان شب: </span>
                      {nightResults.deaths.length > 0 ? (
                        <span className="text-red-400 font-semibold bg-red-955 border border-red-900 px-2 py-0.5 rounded">
                          {nightResults.deaths.map(id => players.find(p => p.id === id)?.name).join('، ')}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold bg-emerald-955 border border-emerald-900 px-2 py-0.5 rounded">خوشبختانه شبی آرام و بدون هیچ کشته‌ای سپری شد.</span>
                      )}
                    </div>

                    {/* Shield Breaks */}
                    {nightResults.shieldBreaks.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-300">سپرشِکسته‌ها: </span>
                        <span className="text-amber-400 font-semibold">
                          {nightResults.shieldBreaks.map(id => players.find(p => p.id === id)?.name).join('، ')} (جان سپر نجاتشان داد)
                        </span>
                      </div>
                    )}

                    {/* Court nominated */}
                    {nightResults.courtNominees.length > 0 && (
                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-slate-300">ورودی‌های مستقیم دادگاه: </span>
                          <span className="text-indigo-400 font-semibold">
                            {nightResults.courtNominees.map(id => players.find(p => p.id === id)?.name).join('، ')} (توسط حکم کارآگاه)
                          </span>
                        </div>
                        <div className="p-2.5 bg-amber-950/25 border border-amber-900/35 rounded-xl space-y-1 text-right">
                          <div className="flex items-center gap-1.5 font-extrabold text-[#f59e0b] text-[9.5px]">
                            <Zap className="w-3 h-3 text-amber-400 animate-pulse animate-duration-1000" />
                            <span>ابلاغ قانون مجمع به بازیکنان (توسط گرداننده):</span>
                          </div>
                          <p className="text-[9px] text-[#e2e8f0] leading-relaxed font-semibold">
                            📢 <strong className="text-amber-300 font-extrabold">توجه:</strong> با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Terrorists newly added */}
                    {nightResults.terroristsAdded.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-300">تروریست‌های اتفاقی شب: </span>
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
                    برای تغییر نقش به حالت «اسرار عیان» بروید.
                  </span>
                </div>

                {showSecrets && (
                  <div className="mb-6 p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 text-right" dir="rtl">
                      <span className="text-[10px] font-bold text-amber-500 block mb-1">➕ اضافه کردن بازیکن جدید به مجمع</span>
                      <input
                        type="text"
                        id="new-player-name-input"
                        placeholder="نام بازیکن جدید را بنویسید..."
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
                      افزودن بازیکن جدید
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
                    احکام کابینه روز
                  </button>
                )}
                <button
                  onClick={() => setSelectedTab('logs')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    selectedTab === 'logs' ? 'bg-[#0b0f19] text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  وقایع مکتوب مجمع
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
                          تشکیلات کابینه دولتی مستقر:
                        </h4>
                        <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
                          روز {cycleNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">رئیس جمهور:</span>
                          <span className={`font-extrabold text-xs ${cabinet.presidentId ? 'text-amber-400' : 'text-slate-600'}`}>
                            {cabinet.presidentId ? players.find((p) => p.id === cabinet.presidentId)?.name : 'بدون تصدی (فوت)'}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          {players.length < 10 ? (
                            <>
                              <span className="block text-slate-500 font-bold">معاون اول:</span>
                              <span className="text-slate-600 italic">حذف شده در شروع</span>
                            </>
                          ) : (
                            <>
                              <span className="block text-slate-500 font-bold">معاون اول ({players.length < 12 ? '۱ رای' : '۲ رای'}):</span>
                              <span className={`font-semibold ${cabinet.vicePresidentId ? 'text-slate-300' : 'text-slate-600'}`}>
                                {cabinet.vicePresidentId ? players.find((p) => p.id === cabinet.vicePresidentId)?.name : 'بدون تصدی'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">شهردار مجمع:</span>
                          <span className={`font-semibold ${cabinet.mayorId ? 'text-slate-300' : 'text-slate-600'}`}>
                            {cabinet.mayorId ? players.find((p) => p.id === cabinet.mayorId)?.name : 'بدون تصدی'}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-904/60 rounded-lg border border-slate-900/50">
                          <span className="block text-slate-500 font-bold">قاضی تالار:</span>
                          <span className={`font-semibold ${cabinet.judgeId ? 'text-slate-300' : 'text-slate-600'}`}>
                            {cabinet.judgeId ? players.find((p) => p.id === cabinet.judgeId)?.name : 'بدون تصدی'}
                          </span>
                        </div>
                      </div>
                      
                      <CollapsibleGuide title="ساختار کابینه و مسئولین منصوب" defaultOpen={false}>
                          <div className="space-y-3 pt-2">
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-amber-400 mb-1">دستیاران معاون رئیس‌جمهور:</p>
                                  <p className="text-[10px] text-slate-400">گزارشگر: {players.find(p => p.role === 'reporter')?.name || 'نامشخص'} | خبرنگار: {players.find(p => p.role === 'journalist')?.name || 'نامشخص'}</p>
                              </div>
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-rose-400 mb-1">دستیاران قاضی:</p>
                                  <p className="text-[10px] text-slate-400">وکیل: {players.find(p => p.role === 'lawyer')?.name || 'نامشخص'}</p>
                              </div>
                              <div className="border border-slate-700/30 rounded-lg p-2 bg-slate-900/50">
                                  <p className="font-bold text-xs text-sky-400 mb-1">دستیاران شهردار:</p>
                                  <p className="text-[10px] text-slate-400">دکتر: {players.find(p => p.role === 'doctor')?.name || 'نامشخص'} | پلیس: {players.find(p => p.role === 'police')?.name || 'نامشخص'} | کارآگاه: {players.find(p => p.role === 'detective')?.name || 'نامشخص'}</p>
                              </div>
                          </div>
                      </CollapsibleGuide>
                    </div>

                    {/* ASSISTANT STEPPER */}
                    <div className="bg-amber-950/10 border border-amber-900/20 p-2.5 rounded-xl flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none">
                      {[
                        { title: 'حوادث', id: 1 },
                        { title: 'تروریست', id: 2 },
                        { title: 'انقلاب', id: 3 },
                        { title: 'ریاست', id: 4 },
                        { title: 'دفاعیه', id: 5 },
                        { title: 'احکام', id: 6 }
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
                        <CollapsibleGuide title="گام ۱ از ۷: اعلام حوادث دیشب مجمع" defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            خروجی خودکار شب گذشته اعم از اعدام ها، ترورهای مستقیم لژ و سپرهای مخدوش شده را به حضار اعلام بفرمایید.
                            <br/><br/>
                            <strong className="text-teal-400">راهنمای جانشینی کشیش (قاعده ۴):</strong> در صورت کشته شدن کشیش مجمع، پاپ اعظم مجاز است یکی از <strong>شهروندان ساده و بدون نقش</strong> را به مقام کشیش جدید منصوب کند. این انتصاب کاملاً <strong>اختیاری</strong> است، اما در صورت عدم انتصاب، قابلیت مشترک پاپ و کشیش (ابطال اعدام زندانی) منجمد می‌شود. پاپ فقط مجاز به تعیین افراد بدون نقش (ساده) است.
                          </p>
                        </CollapsibleGuide>

                        {nightResults && (nightResults.deaths.length > 0 || nightResults.shieldBreaks.length > 0) ? (
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 text-xs text-slate-350 space-y-1.5">
                            {nightResults.deaths.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span>مقتولین شب گذشته: <strong className="text-red-400">{nightResults.deaths.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                              </div>
                            )}
                            {nightResults.shieldBreaks.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>اصابت ناموفق شلیک (سپرِ تخریب‌شده): <strong className="text-amber-400">{nightResults.shieldBreaks.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                              </div>
                            )}
                            {nightResults.courtNominees.length > 0 && (
                              <div className="space-y-1.5 pt-1.5 border-t border-slate-900/40">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span>متهمین مستقیم دادرسی کارآگاه: <strong className="text-indigo-400">{nightResults.courtNominees.map(id => players.find(p => p.id === id)?.name).join('، ')}</strong></span>
                                </div>
                                <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-right">
                                  <p className="text-[9px] text-slate-300 leading-normal font-semibold">
                                    📢 <strong className="text-amber-400 font-extrabold font-sans">تذکر به بازیکنان:</strong> با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-emerald-950/20 border border-emerald-900/35 p-3 rounded-xl text-center text-[10px] text-emerald-400 font-semibold leading-relaxed">
                            ✅ خوشبختانه شبی آرام سپری شد و صبح بدون هیچ مقتولی سر بر آورد.
                          </div>
                        )}

                        {/* Emergency Succession helpers */}
                        {/* 1. Priest Dead and Pope Alive -> Assign a new priest */}
                        {!players.some(p => p.role === 'priest' && p.isAlive) && players.some(p => p.role === 'pope' && p.isAlive) && (
                          <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-2 mt-2">
                            <span className="text-[10px] font-extrabold text-teal-400 block mb-1">⛪ انتصاب جانشین کشیش توسط پاپ اعظم (قاعده ۴)</span>
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
                                    <option value="">برگزیدن شهروند بدون نقش...</option>
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
                                        alert('لطفاً یک بازیکن واجد شرایط انتخاب کنید.');
                                      }
                                    }}
                                    className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black px-3 py-1 rounded transition whitespace-nowrap"
                                  >
                                    تایید کشیش
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
                            <span>ورود به گام دوم: فتنه و انتحار تروریستی روز</span>
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
                          <CollapsibleGuide title="گام ۲ از ۷: فتنه و انتحار تروریستی روز" defaultOpen={false}>
                             <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                               تروریست‌های دارای بمب فعال در روز جاری را به گرداننده معرفی کنید تا اقدام به خروج خود خواسته و متقابل بازیکنان نمایند.<br/>
                               <span className="text-amber-500/80 mt-1 block font-bold">- توجه: پزشک و سپر بی‌اثر است. اما اگر هدف درون زندان باشد فقط تروریست منفجر می‌شود!</span>
                             </p>
                          </CollapsibleGuide>

                          {dayTerrorists.length > 0 ? (
                            <div className="bg-purple-500/15 border border-purple-500/25 text-purple-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>👤 تروریست‌های واجد شرایطِ اقدام امروز:</span>
                              <span className="font-extrabold text-white underline decoration-purple-500/50 underline-offset-2">{dayTerrorists.map(p => p.name).join('، ')}</span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/40 border border-slate-800 text-slate-500 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              ⚠️ هیچ تروریست بمب‌داری در مجمع زنده نیست!
                            </div>
                          )}

                          <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                            <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded-xl text-xs space-y-1.5 text-right">
                              <span className="text-slate-400 text-[10px] block font-bold">تروریست‌های انقلابی امروز مجمع:</span>
                              {dayTerrorists.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {dayTerrorists.map(p => (
                                    <span key={p.id} className="bg-purple-950/60 text-purple-300 px-2.5 py-1 rounded-lg font-bold border border-purple-800/40 text-[11px]">
                                      🧨 {p.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-slate-500 font-bold">هیچ تروریست بمب‌داری در مجمع زنده نیست!</div>
                              )}
                            </div>

                            {dayTerrorists.length > 0 && (
                              <div className="space-y-3 p-3 bg-slate-900/50 rounded-xl border border-slate-850">
                                <span className="text-[10px] font-black text-slate-300 block mb-1">اجرای بمباران انتحاری:</span>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">انتخاب عامل تروریست:</label>
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
                                    <label className="text-[9px] text-slate-400 font-bold block mb-1">انتخاب هدف بیگناه برای انفجار:</label>
                                    <select
                                      id="day-terrorist-target"
                                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded p-1.5 focus:outline-none focus:border-purple-800 text-right"
                                    >
                                      <option value="">برگزیدن بازیکن برای ترور...</option>
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
                                          alert('تروریست طبق قوانین مجمع نمی‌تواند روی خودش انتحار انجام دهد!');
                                          return;
                                        }
                                        let doExplode = true;
                                        try {
                                          doExplode = !window.confirm || confirm(`آیا مایلید بازیکن تروریست را قرینِ هدف منتخب منفجر و هر دو را از بازی خارج کنید؟`);
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
                                              handleLogEvent(`[انتحار بی‌ثمر در زندان] بازیکن تروریست غیور «${shooter.name}» با فعال نمودن جلیقه انفجاری مجمع، به سلول زندان یورش برد اما میله‌های فولادی مانع آسیب به «${target.name}» شد و تنها خودش به هوا رفت!`, 'kill');
                                            } else {
                                              handleLogEvent(`[انتحار تروریستی روز] بازیکن تروریست غیور «${shooter.name}» با فعال نمودن جلیقه انفجاری مجمع، خود را به همراهِ بازیکن «${target.name}» به هوا فرستاد!`, 'kill');
                                            }
                                            targetSel.value = '';
                                          }
                                        }
                                      } else {
                                        alert('لطفاً عامل تروریست و هدف قربانی را انتخاب کنید.');
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
                              برگشت
                            </button>
                            <button
                              onClick={() => setCurrentDayStep(3)}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                            >
                              <span>ورود به گام سوم: انقلاب شهرداری</span>
                              <ChevronLeft className="w-4 h-4 text-slate-950" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* STEP 3: COUPS AND REVOLUTIONS (انقلاب شهردار) */}
                    {currentDayStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title="گام ۲ از ۶: دادگاه انقلاب شهرداری" defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            شهردار زنده مجمع می‌تواند در تالار روز لایحه انقلاب صادر کند.<br/>
                            <span className="text-rose-400 font-bold block mt-1">- پاپ مطلقا امکان وتوی لایحه انقلاب را ندارد.</span>
                            <span className="text-amber-400/90 font-bold block mt-1">- قاضی نیز هیچ‌گونه حق وتوی انفرادی در انقلاب شهردار ندارد؛ سرنوشت انقلاب کاملاً به رای اکثریت (نصف + ۱) گره خورده است.</span>
                            <span className="text-emerald-400/90 font-bold block mt-1">- در صورت موفقیت کودتا، شهردار فوراً جانشین رئیس‌جمهور شده و رئیس‌جمهور سابق مستقیماً متهم دادگاه می‌شود. شکست به معنای خلع شهردار و فرستادن او به دادگاه است!</span>
                            <span className="text-amber-400/90 font-bold block mt-1">- تنش این دادگاه (موفق یا ناموفق) سبب ایجاد بی‌درنگِ ۱ قابلیت تروریست تصادفی می‌شود که در شب قابلیت اقدام دارد.</span>
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const mayor = cabinet.mayorId ? players.find(p => p.id === cabinet.mayorId) : null;
                          return mayor ? (
                            <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>👤 شهردار مجری اقدام انقلاب امروز:</span>
                              <span className="font-extrabold text-white underline decoration-emerald-500/50 underline-offset-2">{mayor.name}</span>
                            </div>
                          ) : (
                            <div className="bg-slate-900/40 border border-slate-800 text-slate-500 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              ⚠️ شهردار فعالی برای انقلاب در مجمع وجود ندارد.
                            </div>
                          );
                        })()}

                        <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
                            <span className="text-slate-500">مقام شهردار مجمع:</span>
                            <span className={cabinet.mayorId ? 'text-amber-400' : 'text-slate-600'}>
                              {cabinet.mayorId ? players.find(p => p.id === cabinet.mayorId)?.name : 'هیچکس زنده نیست (فاقد اقدام)'}
                            </span>
                          </div>
                          
                          {cabinet.mayorId && cabinet.presidentId ? (
                            <div className="space-y-3">
                              <p className="text-[9px] text-slate-500">رای‌های مجمع شمرده شود: اگر تعداد آرا بالاتر از نصف مجمع + ۱ باشد مصلح انقلاب موفق بوده و تالار به فرمان شهردار جابه‌جا می‌گردد.</p>
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
                                  {mayorRevoltedToday ? 'انقلاب ثبت شده' : 'انقلاب موفق (تنزيل رئیس)'}
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
                                  {mayorRevoltedToday ? 'انقلاب ثبت شده' : 'انقلاب ناموفق (متهم شدن شهردار)'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 text-center py-2">شرایط ائتلاف مهیا نیست (فوت یکی از طرفین قدرت رئیس/شهردار).</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(2)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            برگشت
                          </button>
                          <button
                            onClick={() => setCurrentDayStep(4)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>ورود به گام چهارم: عزل و نصب ریاست</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: PRESIDENT ROLE MANAGEMENT (اختیارات رئیس جمهور) */}
                    {currentDayStep === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title="گام ۴ از ۷: جابه‌جایی و انتصابات ریاست مجمع" defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            رئیس‌جمهور در صورت حیاة می‌تواند بین دو جایگاه جابه‌جایی امضا کند، و یا نقشهای مقتول شهر را به غیر اختصاص دهد.
                            <br/><br/>
                            🚨 <strong className="text-amber-400">قانون محدودیت مهره دوم:</strong> طبق مصوبات جدید مجمع، اگر نقش انتخاب شده در <strong>مهره نخست (مهر اول)</strong> خالی و بدون بازیکن بوده باشد (نقش مقتول)، بازیکنانِ تالار که دارای نقش‌های زنده و فعالِ <strong>قاضی</strong> یا <strong>شهردار</strong> هستند، هرگز نباید به عنوان برگزیده در <strong>مهره دوم (مهر دوم)</strong> دیده شوند یا این نقش‌ها را تصاحب نمایند.
                            <br/><br/>
                            <strong className="text-rose-400">راهنمای بحران کلیسا (قاعده ۸ - فوت همزمان):</strong> در صورتی که <strong>پاپ و کشیش به صورت همزمان</strong> کشته شده باشند (مثلاً با بمب تروریست)، رئیس‌جمهور مجاز و <strong>موظف</strong> است یک نفر را برای مقام پاپ اعظم منصوب کند. (اولویت اول با بازیکنان بدون نقش است. در غیر این صورت از میان سایر بازیکنان واجد شرایط به صورت چرخشی استفاده می‌شود.)
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const president = cabinet.presidentId ? players.find(p => p.id === cabinet.presidentId) : null;
                          return president ? (
                            <div className="bg-amber-500/15 border border-amber-500/25 text-amber-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>👤 رئیس‌جمهور مجری جابه‌جایی و انتصابات:</span>
                              <span className="font-extrabold text-white underline decoration-amber-500/50 underline-offset-2">{president.name}</span>
                            </div>
                          ) : (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-2.5 rounded-xl text-xs font-bold font-sans text-center">
                              ⚠️ رئیس‌جمهور فعالی در مجمع حضور ندارد یا فوت شده است.
                            </div>
                          );
                        })()}

                        {cabinet.presidentId ? (
                          <div className="space-y-4">
                            {/* Unified President Action: Swap/Fill */}
                            <div className="p-3.5 bg-slate-950/40 border border-slate-850/60 rounded-xl shadow-lg hover:border-amber-500/10 transition-all duration-300">
                              <span className="text-[10px] font-bold text-amber-400 block mb-2">🔄 اختیارات قانونی ریاست‌جمهوری (پر کردن/جابه‌جایی نقش‌ها)</span>
                              <p className="text-[8.5px] text-slate-400 leading-normal mb-3">
                                <strong>مهره نخست (نقش):</strong> اولویت اول با قاضی خالی، اولویت دوم با سایر نقش‌های خالی، اولویت سوم جابه‌جایی نقش‌های موجود.<br/>
                                <strong>مهره دوم (بازیکن):</strong> اولویت مطلق با بازیکنان بدون نقش است. <span className="text-rose-400 font-bold">(توجه: اگر مهره نخست بدون بازیکن/خالی باشد، بازیکنان دارای نقش قاضی و شهردار در مهره دوم دیده نخواهند شد)</span>.
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
                                            <option value="">مهره نخست...</option>
                                            <option value="judge">قاضی</option>
                                          </>
                                        );
                                      }
                                      
                                      if (!aliveRoles.has('mayor')) {
                                        return (
                                          <>
                                            <option value="">مهره نخست...</option>
                                            <option value="mayor">شهردار</option>
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
                                            <option value="">مهره نخست...</option>
                                            {otherVacant.map(r => (
                                              <option key={r} value={r}>{ROLE_DETAILS[r].nameFa}</option>
                                            ))}
                                          </>
                                        );
                                      }

                                      return (
                                        <>
                                          <option value="">مهره نخست...</option>
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
                                          <option value="">مهره دوم...</option>
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
                                      alert('لطفاً مهره نخست (نقش) و مهره دوم (بازیکن) را انتخاب کنید.');
                                    }
                                  }}
                                  disabled={presidentSwappedToday}
                                  className={`w-full text-[10px] font-black py-1.5 rounded-lg transition ${
                                    presidentSwappedToday
                                      ? 'bg-slate-900 text-slate-650 cursor-not-allowed'
                                      : 'bg-amber-600 hover:bg-amber-700 text-slate-950'
                                  }`}
                                >
                                  {presidentSwappedToday ? 'اختیارات این فاز اعمال شده است' : 'صدور فرمان'}
                                </button>
                              </div>
                            </div>

                            {/* Both Dead emergency Assign Pope (Rule 8) */}
                            {!players.some(p => p.role === 'pope' && p.isAlive) && !players.some(p => p.role === 'priest' && p.isAlive) && (
                              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2 mt-2">
                                <span className="text-[10px] font-black text-rose-400 block mb-1">⛪ تعیین اضطراری پاپ اعظم جدید (قاعده ۸)</span>
                                <p className="text-[8.5px] text-slate-400 leading-normal">رئیس‌جمهور موظف است در فوت همزمان پاپ و کشیش، پاپ جدید را با اولویت شهروند ساده (قاضی و کشیش مجاز نیستند) برگزیند.</p>
                                <div className="flex gap-2">
                                  <select
                                    id="president-assign-pope-select"
                                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded p-1 flex-1 focus:outline-none col-span-2 grow"
                                  >
                                    <option value="">شهروند واجد صلاحیت...</option>
                                    {players
                                      .filter(p => p.isAlive && p.id !== cabinet.presidentId && p.role !== 'judge' && p.role !== 'priest')
                                      .sort((a,b) => {
                                        if (a.role === 'none' && b.role !== 'none') return -1;
                                        if (a.role !== 'none' && b.role === 'none') return 1;
                                        return 0;
                                      })
                                      .map(p => (
                                        <option key={p.id} value={p.id}>{p.name} {p.role === 'none' ? '(اولویت: شهروند ساده)' : `(${(ROLE_DETAILS[p.role] || ROLE_DETAILS['none']).nameFa})`}</option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const s = document.getElementById('president-assign-pope-select') as HTMLSelectElement;
                                      if (s && s.value) {
                                        handlePresidentAssignNewPope(s.value);
                                        s.value = '';
                                      } else {
                                        alert('یک بازیکن را برگزینید.');
                                      }
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-slate-950 text-[10px] font-black px-3 py-1 rounded whitespace-nowrap"
                                  >
                                    منصوب کن
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-950/80 p-4 border border-slate-900 rounded-xl text-center text-slate-500 font-bold text-xs py-5">
                            رئیس‌جمهور مجمع فوت نموده یا فاقد کرسی می‌باشد.
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setCurrentDayStep(3)}
                            className="bg-slate-900 text-slate-400 hover:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                            برگشت
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
                            <span>ورود به گام پنجم: لایحه دفاعیه مجمع</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: COURT FORMATION & DEFENSE TIMER (نامزدان و دفاعیه دادگاه) */}
                    {currentDayStep === 5 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title="گام ۵ از ۶: ثبت متهمین تالار و لایحه وکیل" defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            حداکثر ۲ متهم مجمع را ثبت بفرمایید و لایحه ۱ دقیقه‌ای وکیل (برای دفاع یا حمله به متهمین) را شبیه‌سازی کنید.
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const lawyer = players.find(p => p.role === 'lawyer' && p.isAlive && !p.isImprisoned);
                          return lawyer ? (
                            <div className="bg-[#1d273e] border border-[#2b3a5a] text-sky-300 p-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-between">
                              <span>👤 وکیل مدافع (ایرادکننده لایحه دفاعیه):</span>
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
                            ⚠️ تذکر: لایحه حکم نهایی دادگاهِ عالی امروز صادر شده است. هر مجمع بیش از ۱ دادگاه مجاز نیست.
                          </div>
                        )}

                        {/* Defense Lawyer Timer */}
                        <div className="bg-slate-950 p-3 border border-slate-900 rounded-xl flex items-center justify-between">
                          <div className="text-right">
                            <span className="block text-[9.5px] text-slate-400 font-bold">کرونومتر ۶۰ ثانیه وکیل مدافع:</span>
                            <span className="font-mono font-extrabold text-amber-500 text-xs text-right block mt-0.5">{timerCount} ثانیه‌</span>
                          </div>
                          <div className="flex gap-1" dir="ltr">
                            <button
                              onClick={handleToggleTimer}
                              className="text-[10px] font-black bg-[#1d273e] hover:bg-[#2c3a5b] px-3 py-1.5 text-slate-200 rounded-lg cursor-pointer"
                            >
                              {timerRunning ? 'توقف' : 'شروع'}
                            </button>
                            <button
                              onClick={handleResetTimer}
                              className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-400 rounded-lg cursor-pointer"
                            >
                              ریست
                            </button>
                          </div>
                        </div>

                        {/* Selected court nominees list */}
                        <div className="space-y-2 mt-2">
                          <span className="block text-[10px] text-slate-300 font-black">متهمین منتخب تالار دادگاه امشب (ظرفیت: {courtSelectedPlayers.length}/۲ نفر):</span>
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900/80 text-xs text-slate-400 space-y-2">
                            {courtSelectedPlayers.length === 0 ? (
                              <span className="text-[10px] text-slate-600 block text-center font-bold">هیچ متهمی در لیست تالار حضور ندارد.</span>
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
                                        handleLogEvent(`[عفو فوری] عفو خطای دستی ثبت متهم برای «${p.name}» انجام پذیرفت.`, 'system');
                                      }}
                                      className="bg-slate-900 text-slate-300 text-[9px] font-bold px-2 py-1 rounded border border-slate-800 hover:bg-slate-800 transition"
                                      title="لغو ثبت اشتباه"
                                    >
                                      لغو و بازگشت
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
                            <span className="block text-[10px] font-bold text-slate-400">ثبت پرونده و ارسال دستی شخص به دادگاه:</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  if (courtSelectedPlayers.includes(e.target.value)) return;
                                  if (courtSelectedPlayers.length >= 2) {
                                    alert('ورودی دادگاه قانوناً بیش از دو نفر نمی‌تواند باشد.');
                                    e.target.value = '';
                                    return;
                                  }
                                  const targetPl = players.find(p => p.id === e.target.value);
                                  if (targetPl && isRestrictedFromCourt(targetPl)) {
                                    alert('رئیس‌جمهور، پاپ و قاضی مصونیت قضایی دارند و به دادگاه نمی‌روند!');
                                    e.target.value = '';
                                    return;
                                  }
                                  setCourtSelectedPlayers([...courtSelectedPlayers, e.target.value]);
                                }
                                e.target.value = '';
                              }}
                              className="w-full bg-[#050810] border border-slate-800 text-xs text-slate-400 rounded-lg p-2 focus:outline-none"
                            >
                              <option value="">برگزیدن متهم جرمان...</option>
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
                            برگشت
                          </button>
                          <button
                            onClick={() => setCurrentDayStep(6)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                          >
                            <span>ورود به گام ششم: احکام قاضی</span>
                            <ChevronLeft className="w-4 h-4 text-slate-950" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 6: JUDGE VERDICTS & PRISON HOUSING */}
                    {currentDayStep === 6 && (
                      <div className="space-y-4 animate-fadeIn">
                        <CollapsibleGuide title="گام ۶ از ۶: رای نهایی قاضی، سیاهچال و صیانت پاپ" defaultOpen={false}>
                          <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                            قاضی تالار مجمع رای نهایی را اعمال می‌سازد. در صورت محکومیتِ اعدام، پاپ اعظم کلیسا می‌تواند آن را به طور زنده وتو کند.
                          </p>
                        </CollapsibleGuide>

                        {(() => {
                          const judge = players.find(p => p.role === 'judge' && p.isAlive && !p.isImprisoned);
                          const pope = players.find(p => p.role === 'pope' && p.isAlive && !p.isImprisoned);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded-xl font-bold font-sans flex items-center justify-between">
                                <span>⚖️ قاضی مجمع (رای نهایی):</span>
                                <span className="font-extrabold text-white underline decoration-amber-500/50 underline-offset-2">{judge ? judge.name : 'فاقد قاضی فعال/زنده'}</span>
                              </div>
                              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2.5 rounded-xl font-bold font-sans flex items-center justify-between">
                                <span>⛪ پاپ اعظم (وتوکننده):</span>
                                <span className="font-extrabold text-white underline decoration-indigo-500/50 underline-offset-2">{pope ? pope.name : 'فاقد پاپ فعال/زنده'}</span>
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
                            <span className="text-[9.5px] text-slate-400 font-bold">⛪ جایگاه صیانت کلیسایی (پاپ اعظم):</span>
                            <span className={players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) ? 'text-emerald-400 text-[10px] font-black' : 'text-slate-600 text-[10px] font-black'}>
                              {players.some(p => p.role === 'pope' && p.isAlive && !p.isImprisoned) 
                                ? `زنده و حاکم: «${players.find(p => p.role === 'pope' && p.isAlive && !p.isImprisoned)?.name}»` 
                                : 'فاقد پاپ اعظم فعال یا زندانی شده'}
                            </span>
                          </div>

                          {popeVetoCooldown > 0 ? (
                            <div className="text-[9px] text-amber-500 bg-amber-955/20 border border-amber-900/30 px-2 py-1.5 rounded-lg font-medium leading-relaxed font-sans">
                              ⏳ قابلیت ثبت وتوی پاپ هم‌اکنون در دوره انتظار قانون اعدام یک روز در میان است ({popeVetoCooldown} نوبت استراحت غیاب پاپ).
                            </div>
                          ) : (
                            <div className="text-[9px] text-emerald-450 bg-emerald-955/10 border border-emerald-900/30 px-2 py-1.5 rounded-lg font-medium leading-relaxed font-sans">
                              📜 منشور وتوی صیانت پاپ تافته و آماده بهره‌برداری است! پاپ در صورت اعدام متهم مجمع یا زندان، به صورت اتوماتیک یا دستی دکمه وتو را فعال دارد.
                            </div>
                          )}

                          {/* Inline Veto Option 2: Court Nominee Execution Veto */}
                          {courtExecutionToVeto && (
                            <div className="p-2 bg-rose-955/20 rounded-lg border border-rose-900/40 space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-rose-400 flex items-center gap-1">⚠️ حکم محکومیت اعدام دادگاه مجمع:</span>
                                <span className="text-rose-400 font-black text-[9px] bg-rose-955/40 border border-rose-900/40 px-1.5 py-0.5 rounded animate-pulse">آماده دفاع پاپ</span>
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
                                {popeVetoCooldown > 0 ? 'وتوی پاپ در دوره انتظار (یک روز در میان) است' : '⛪ وتوی مذهبی پاپ و بازگرداندن متهم به مجمع'}
                              </button>
                            </div>
                          )}

                          {/* Inline Veto Option 3: Prisoner Execution Veto */}
                          {prisonerExecutionToVeto && (
                            <div className="p-2 bg-rose-955/20 rounded-lg border border-rose-900/40 space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-rose-400 flex items-center gap-1">⚠️ حکم اعدام زندانی در سیاهچال:</span>
                                <span className="text-rose-400 font-black text-[9px] bg-rose-955/40 border border-rose-900/40 px-1.5 py-0.5 rounded animate-pulse">آماده دفاع پاپ</span>
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
                                {popeVetoCooldown > 0 ? 'وتوی پاپ در دوره انتظار (یک روز در میان) است' : '⛪ وتوی مذهبی پاپ و ابطال مرگ زندانی'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Court selected nominees ruling panel */}
                        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                          <span className="block text-[10px] text-slate-300 font-black border-b border-slate-900 pb-1.5 flex items-center gap-1 pb-1">
                            <Scale className="w-4 h-4 text-amber-500" />
                            صدور حکم حاکمه دادگاه عالی قاضی:
                          </span>
                          
                          {courtSelectedPlayers.length === 0 ? (
                            <p className="text-[10px] text-slate-500 text-center py-2 font-bold select-none">متهم فعالی در تالار دادگاه وجود ندارد.</p>
                          ) : (
                            <div className="space-y-3.5 text-xs text-slate-400">
                              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1.5 text-right">
                                <div className="flex items-center gap-1.5 font-black text-amber-400 text-[10px]">
                                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>نکته مهم برای گرداننده:</span>
                                </div>
                                <p className="text-[9.5px] text-slate-300 leading-relaxed font-semibold">
                                  📢 <strong className="text-amber-300 font-extrabold">ابلاغ قانون مجمع به بازیکنان:</strong> گرداننده موظف است این فکت را به بازیکنان و متهم بگوید که با صدور عفو، زندان یا لایحه مرگ برای یک متهم، کاندیدای دیگر تالار به صورت خودکار تبرئه تام‌الاختیار می‌گردد.
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
                                        <p className="text-[10px] text-rose-450 font-bold leading-normal">⚠️ این متهم در مجمع امروز محکوم به اعدام شد.</p>
                                        <button
                                          onClick={handleVetoCourtExecution}
                                          disabled={popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1}
                                          className={`w-full text-[9px] font-black py-1 rounded transition border ${
                                            popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1
                                              ? 'bg-slate-900 border-transparent text-slate-650 cursor-not-allowed'
                                              : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                          }`}
                                        >
                                          {popeVetoCooldown > 0 ? 'وتوی پاپ در دوره خنک‌سازی است' : '⛪ وتوی مذهبی پاپ و بازگرداندن متهم'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-3 gap-1" dir="ltr">
                                        <button
                                          onClick={() => handleExecuteVerdict('execute', p.id)}
                                          className="bg-rose-950/80 text-rose-400 text-[9.5px] font-black py-1 px-1.5 rounded border border-rose-900/50 hover:bg-rose-900 transition"
                                        >
                                          اعدام نهایی
                                        </button>
                                        <button
                                          onClick={() => handleExecuteVerdict('jail', p.id)}
                                          className="bg-amber-950/80 text-amber-300 text-[9.5px] font-black py-1 px-1.5 rounded border border-amber-900/50 hover:bg-amber-900 transition"
                                        >
                                          حبس زندان
                                        </button>
                                        <button
                                          onClick={() => handleExecuteVerdict('pardon', p.id)}
                                          className="bg-emerald-950/80 text-emerald-400 text-[9.5px] font-black py-1 px-1.5 rounded border border-emerald-900/50 hover:bg-emerald-900 transition"
                                        >
                                          تبرئه فوری
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
                              <div className="text-center py-2 text-slate-600 font-bold text-[9.5px] select-none">هیچ شخصی در سلول انفرادی زندان محبوس نیست.</div>
                            ) : (
                              players.filter(p => p.isAlive && p.isImprisoned || prisonerExecutionToVeto === p.id).map((p) => (
                                <div key={p.id} className="flex-col border-b border-slate-900/50 pb-1.5 last:border-0 last:pb-0 gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-amber-500 font-sans">{p.name} <span className="text-[8px] text-slate-500 font-normal">(بدون نقش)</span></span>
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle !== cycleNumber && !prisonerVerdictGivenToday && (
                                      <div className="flex gap-1" dir="ltr">
                                        <button
                                          onClick={() => handleExecutePrisonerVerdict(p.id, 'execute')}
                                          className="bg-rose-955 text-rose-400 text-[8px] font-black px-2 py-1 rounded-md border border-rose-900/80 hover:bg-rose-900/20"
                                        >
                                          اعدام زندانی
                                        </button>
                                        <button
                                          onClick={() => handleExecutePrisonerVerdict(p.id, 'pardon')}
                                          className="bg-emerald-955 text-emerald-400 text-[8px] font-black px-2 py-1 rounded-md border border-emerald-900/80 hover:bg-emerald-900/20"
                                        >
                                          عفو و آزادی
                                        </button>
                                      </div>
                                    )}
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle !== cycleNumber && prisonerVerdictGivenToday && (
                                      <span className="text-[8px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">حکم امروز صادر شده</span>
                                    )}
                                    {prisonerExecutionToVeto !== p.id && p.imprisonedAtCycle === cycleNumber && (
                                      <span className="text-[8px] font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">جدیدالورود (امروز حکمی دریافت نمی‌کند)</span>
                                    )}
                                  </div>
                                  {prisonerExecutionToVeto === p.id && (
                                    <div className="p-2 bg-amber-955/20 border border-amber-900/40 rounded-lg mt-1 space-y-1 text-right">
                                      <p className="text-[10px] text-rose-450 font-bold leading-normal">⚠️ این زندانی اعدام انقلابی شد.</p>
                                      <button
                                        onClick={handleVetoPrisonerExecution}
                                        disabled={popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1}
                                        className={`w-full text-[9px] font-black py-1 rounded transition border ${
                                          popeVetoCooldown > 0 || !players.some(x => x.role === 'pope' && x.isAlive && !x.isImprisoned) || cycleNumber < 1
                                            ? 'bg-slate-900 border-transparent text-slate-650 cursor-not-allowed'
                                            : 'bg-amber-900 hover:bg-amber-800 text-white border-amber-700'
                                        }`}
                                      >
                                        {popeVetoCooldown > 0 ? 'وتو در خنک‌سازی است' : '⛪ وتوی مذهبی پاپ و بازگرداندن به سلول'}
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
                            برگشت
                          </button>
                          <button
                            onClick={handleBeginNight}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Moon className="w-4 h-4 text-slate-950" />
                            <span>پایان فاز روز و رفتن به بستر شب جدید</span>
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
                      <h4 className="text-xs font-bold text-slate-200">صندوق تاریخچه وقایع مجمع</h4>
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
                        {logsConfirmActive ? 'تایید پاک‌سازی؟' : 'پاک کردن'}
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-[500px] space-y-2 pr-1 custom-scrollbar text-xs">
                      {logs.length === 0 ? (
                        <p className="text-center text-slate-600 py-10">وقایعی ثبت نگردیده است.</p>
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
                                  {log.phase === 'night' ? 'شب' : log.phase === 'setup' ? 'آغاز' : 'روز'}
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

      {/* Global Guide Modal Dialog */}
      {showRoleGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-5xl w-full my-auto animate-fadeIn">
            <GameGuide 
              key={`modal-${guideDefaultMode}-${guideDefaultSearch}`}
              onClose={() => setShowRoleGuide(false)} 
              defaultActiveMode={guideDefaultMode}
              defaultSearchTerm={guideDefaultSearch}
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
                  <span className="text-xs font-black text-white">کنترل‌های دسترسی سریع (دِو)</span>
                </div>
                <button
                  onClick={() => setDevPanelOpen(false)}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer font-bold"
                >
                  بستن ×
                </button>
              </div>

              <p className="text-[9px] text-slate-400 mb-3 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 leading-relaxed font-semibold">
                این تابلوی کمکی صرفاً در حوزه توسعه فعال است و با آن بدون پر کردن تک‌تک فرم‌ها می‌توانید به تمامی مراحل و ریزگام‌ها بروید.
              </p>

              <div className="border-b border-slate-900 pb-3 mb-3">
                <span className="text-[10px] font-bold text-slate-400 block mb-2">تغییر لوگوی برنامه (ذخیره در مروگر):</span>
                <div className="flex gap-2">
                  <label className="flex-1 text-center bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] py-2 rounded-lg font-bold text-amber-500 transition cursor-pointer">
                    انتخاب تصویر از چت/سیستم
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
                      حذف
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* section 1: Main Game Phases */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">۱. فازهای اصلی بازی:</span>
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
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">۲. گام‌های آغازین روز صفر (Day 0):</span>
                  <div className="grid grid-cols-3 gap-1 text-[8px]">
                    <button
                      onClick={() => handleJumpToDay0Step(1)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۱: خوانش اسرار
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(2)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۲: سر صحبت
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(3)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۳: انتخاب پاپ
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(4)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۴: انتصاب کشیش
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(5)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۵: رئیس‌جمهور
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(6)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۶: تشکیل کابینه
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(7)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۷: عزل و نصب معاون
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(8)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۸: انتصاب زیرگروه شهردار
                    </button>
                    <button
                      onClick={() => handleJumpToDay0Step(9)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-medium"
                    >
                      ۹: قاضی و وکیل
                    </button>
                  </div>
                </div>

                {/* section 3: Night Sub-steps */}
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">۳. گام‌های نوبتی فاز شب (Night Wizard):</span>
                  <div className="grid grid-cols-4 gap-1 text-[8px]" dir="rtl">
                    <button
                      onClick={() => handleJumpToNightStep(1)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="مختل‌سازی کشیش"
                    >
                      ۱: کشیش
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(2)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="پزشک اورژانسی"
                    >
                      ۲: دکتر
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(3)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="انتحار تروریستی"
                    >
                      ۳: تروریست
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(4)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="شلیک پلیس"
                    >
                      ۴: پلیس
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(5)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="جلب پرونده کارآگاه"
                    >
                      ۵: کارآگاه
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(6)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="استعلام حقیقت خبرنگار"
                    >
                      ۶: خبرنگار
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(7)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="شلیک ماسون مقتدر"
                    >
                      ۷: ماسون
                    </button>
                    <button
                      onClick={() => handleJumpToNightStep(8)}
                      className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-900 transition text-slate-300 font-bold"
                      title="ردیابی دوربین گزارشگر"
                    >
                      ۸: گزارشگر
                    </button>
                  </div>
                </div>

                {/* section 4: Winner Simulation */}
                <div className="border-t border-slate-900 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">۴. شبیه‌ساز نتیجه پایان بازی:</span>
                  <div className="grid grid-cols-3 gap-1 text-[8px]">
                    <button
                      onClick={() => {
                        setSimulatedWinner('freemason');
                        setGamePhase('gameover');
                        handleLogEvent('[شبیه‌ساز] پیروزی لژ فراماسون‌ها فعال گردید.', 'system');
                      }}
                      className={`p-1 rounded font-bold text-center border transition ${
                        simulatedWinner === 'freemason'
                          ? 'bg-rose-500 text-slate-950 border-rose-300'
                          : 'bg-slate-950 border-slate-850 text-rose-300 hover:bg-slate-900'
                      }`}
                    >
                      برد فراماسون
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedWinner('citizen');
                        setGamePhase('gameover');
                        handleLogEvent('[شبیه‌ساز] پیروزی نهضت شهروندان فعال گردید.', 'system');
                      }}
                      className={`p-1 rounded font-bold text-center border transition ${
                        simulatedWinner === 'citizen'
                          ? 'bg-sky-500 text-slate-950 border-sky-300'
                          : 'bg-slate-950 border-slate-850 text-sky-300 hover:bg-slate-900'
                      }`}
                    >
                      برد شهروندان
                    </button>
                    <button
                      onClick={() => {
                        setSimulatedWinner(null);
                        setGamePhase('day');
                        handleLogEvent('[شبیه‌ساز] شبیه‌سازی برد باطل و وضعیت به عادی برگشت.', 'system');
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 transition text-slate-100 border border-slate-700 font-bold"
                    >
                      پاکسازی برد
                    </button>
                  </div>
                </div>

                {/* section 5: Terrorist Assignment Helper */}
                <div className="border-t border-slate-900 pt-2 text-right">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">۵. تخصیص و شبیه‌سازی تروریست مجمع:</span>
                  <div className="space-y-1 text-[8px] text-right">
                    <button
                      onClick={() => {
                        const eligible = players.filter((p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility);
                        if (eligible.length === 0) {
                          alert('هیچ بازیکن زنده و واجد شرایطی جهت دریافت قابلیت تروریست یافت نشد.');
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
                        handleLogEvent(`[شبیه‌ساز] به دستور دستی توسعه، بازیکن «${chosen.name}» به عنوان تروریست بازی منصوب شد.`, 'ability');
                      }}
                      className="w-full p-1.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 hover:bg-rose-950/80 transition text-center font-bold"
                    >
                      تخصیص تروریست تصادفی (اولویت فاقد شکل/نقش)
                    </button>
                    <div className="text-[9px] text-slate-400 bg-[#06080f] p-1.5 rounded leading-relaxed border border-slate-900 mt-1">
                      تروریست‌های زنده فعلی:{' '}
                      <span className="text-rose-400 font-black">
                        {players.filter(p => p.hasTerroristAbility && p.isAlive).map(p => p.name).join('، ') || 'هیچکس'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-2.5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block">میانبرها و دستورات سریع:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setCycleNumber((prev) => Math.max(1, prev - 1));
                        handleLogEvent('[توسعه] تعداد دوره دستی کاهش یافت.', 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      دوره قبلی (-)
                    </button>
                    <button
                      onClick={() => {
                        setCycleNumber((prev) => prev + 1);
                        handleLogEvent('[توسعه] تعداد دوره دستی افزایش یافت.', 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      دوره بعدی (+)
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const defaultNames = ['مهرداد', 'نیما', 'سپیده', 'آرمان', 'صبا', 'کیوان', 'بهار', 'رامین', 'رویا', 'سینا'];
                        const assigned = initializePlayers(defaultNames);
                        setPlayers(assigned);
                        handleLogEvent('[توسعه] ۱۰ بازیکن تستی به صورت پیش‌فرض مقداردهی اولیه شدند.', 'system');
                      }}
                      className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] py-1.5 rounded-lg font-bold text-slate-300 text-center transition cursor-pointer"
                    >
                      تولید ۱۰ بازیکن تستی
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
                        handleLogEvent('[توسعه] اطلاعات کل بازی فوراً ریست شد.', 'system');
                      }}
                      className="flex-1 bg-rose-950/20 hover:bg-rose-950/35 border border-rose-900/30 text-rose-400 text-[10px] py-1.5 rounded-lg font-bold text-center transition cursor-pointer"
                    >
                      ریست دسته‌جمعی آنی
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
            راهنما و قوانین بازی
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
                title="بازی از اول"
              >
                <RotateCcw className="w-4 h-4" />
                {resetConfirmActive ? 'تایید شروع مجدد؟ (کلیک دوباره)' : 'شروع مجدد'}
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
