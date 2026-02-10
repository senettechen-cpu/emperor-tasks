
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Resources, Faction, Project, ArmyStrength, SectorTrait, PlanetaryTraitType, BattleResult, SectorHistory, UnitType, AstartesState, AstartesResources, AscensionCategory, RitualActivity } from '../types';
import { api } from '../services/api';
import { RITUAL_ACTIVITIES } from '../data/astartesData';


interface GameContextType {
    tasks: Task[];
    resources: Resources;
    corruption: number;
    ownedUnits: string[];
    isPenitentMode: boolean;
    addTask: (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring?: boolean, dueTime?: string, ascensionCategory?: AscensionCategory, subCategory?: string) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    purgeTask: (id: string) => void;
    deleteTask: (id: string) => void;
    buyUnit: (unitId: string, cost: number) => void;
    cleanseCorruption: () => void; // New Action
    resetGame: () => void;
    // Armory
    radarTheme: string;
    purchaseItem: (cost: number, type: string) => void;
    // Strategic
    viewMode: 'tactical' | 'strategic';
    setViewMode: (mode: 'tactical' | 'strategic') => void;
    projects: Project[];
    addProject: (title: string, difficulty: number, month: string) => string;
    addSubTask: (projectId: string, title: string) => void;
    completeSubTask: (projectId: string, subTaskId: string) => void;
    updateSubTask: (projectId: string, subTaskId: string, title: string) => void;
    deleteSubTask: (projectId: string, subTaskId: string) => void;
    deleteProject: (projectId: string) => void;

    // Deployment Actions
    armyStrength: ArmyStrength;
    currentMonth: number;
    getTraitForMonth: (monthId: string) => PlanetaryTraitType;
    sectorHistory: SectorHistory;
    resolveSector: (monthId: string) => void;
    advanceMonth: () => void; // Debug/Cheat
    allTasks: Task[]; // Unfiltered list for management

    // New Mechanics
    activeTacticalScan: boolean;
    activateTacticalScan: () => void;
    fortifiedSectors: string[];
    fortifySector: (monthId: string) => void;
    triggerBattlefieldMiracle: (monthId: string) => void;
    deployUnit: (monthId: string, unitType: UnitType, count: number) => void;
    recallUnit: (monthId: string, unitType: UnitType, count: number) => void;
    recruitUnit: (type: UnitType) => void;

    // Settings
    notificationEmail: string;
    emailEnabled: boolean;
    updateSettings: (email: string, enabled: boolean) => void;
    modifyResources: (rpChange: number, gloryChange: number, reason: string) => void;
    modifyCorruption: (change: number, reason: string) => void;

    // STC
    exportSTC: () => void;
    importSTC: (jsonData: string) => Promise<void>;

    // Debug / GM Tools
    debugSetResources: (res: Resources) => void;
    debugSetCorruption: (val: number) => void;
    debugSetArmyStrength: (army: ArmyStrength) => void;

    // Astartes
    astartes: AstartesState;
    modifyAstartesResources: (changes: Partial<AstartesResources>, reason: string) => void;
    updateAstartes: (newState: Partial<AstartesState>) => void;
    grantAscensionReward: (units: UnitType[], glory?: number) => void;
    addRitualActivity: (category: AscensionCategory, name: string, baseDifficulty: number) => void;
    updateRitualActivity: (category: AscensionCategory, activityId: string, updates: Partial<RitualActivity>) => void;
    deleteRitualActivity: (category: AscensionCategory, activityId: string) => void;
}


const GameContext = createContext<GameContextType | undefined>(undefined);

import { useAuth } from './AuthContext';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Auth
    const { getToken, user } = useAuth();

    // State Initialization
    const [tasks, setTasks] = useState<Task[]>([]);
    const [resources, setResources] = useState<Resources>({ rp: 0, glory: 0 });
    const [corruption, setCorruption] = useState<number>(0);
    const [ownedUnits, setOwnedUnits] = useState<string[]>([]);
    const [radarTheme, setRadarTheme] = useState<string>('green');
    const [notificationEmail, setNotificationEmail] = useState<string>('');
    const [emailEnabled, setEmailEnabled] = useState<boolean>(false);

    // Astartes State
    const [astartes, setAstartes] = useState<AstartesState>({
        resources: { adamantium: 0, neuroData: 0, puritySeals: 0, geneLegacy: 0 },
        unlockedImplants: [],
        completedStages: [],
        ritualActivities: RITUAL_ACTIVITIES
    });


    // Strategic Mode States
    const [viewMode, setViewMode] = useState<'tactical' | 'strategic'>('tactical');
    const [projects, setProjects] = useState<Project[]>([]);

    const [armyStrength, setArmyStrength] = useState<ArmyStrength>({
        reserves: {
            guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0,
            wolf_guard: 0, phalanx_warder: 0, purifier: 0, pyroclast: 0, redemptor_dreadnought: 0
        },
        garrisons: {},
        totalActivePower: 0
    });
    const [activeTacticalScan, setActiveTacticalScan] = useState(false);
    const [fortifiedSectors, setFortifiedSectors] = useState<string[]>([]);


    const updateSettings = async (email: string, enabled: boolean) => {
        setNotificationEmail(email);
        setEmailEnabled(enabled);
        // Sync is handled by the effect, but for immediate UI changes we set state.
        // Actually, explicit sync is better for settings to ensure persistence even if effect is debounced/laggy?
        // But the effect covers it. We rely on the effect.
    };

    const calculateActivePower = (garrisons: Record<string, Record<UnitType, number>>) => {
        const POWER: Record<UnitType, number> = {
            guardsmen: 50, space_marine: 300, custodes: 1500, dreadnought: 500, baneblade: 5000,
            wolf_guard: 400, phalanx_warder: 400, purifier: 400, pyroclast: 400, redemptor_dreadnought: 2000
        };
        let total = 0;
        Object.values(garrisons).forEach((g) => {
            total += (g.guardsmen || 0) * POWER.guardsmen;
            total += (g.space_marine || 0) * POWER.space_marine;
            total += (g.custodes || 0) * POWER.custodes;
            total += (g.dreadnought || 0) * POWER.dreadnought;
            total += (g.baneblade || 0) * POWER.baneblade;

            // Astartes Units
            total += (g.wolf_guard || 0) * POWER.wolf_guard;
            total += (g.phalanx_warder || 0) * POWER.phalanx_warder;
            total += (g.purifier || 0) * POWER.purifier;
            total += (g.pyroclast || 0) * POWER.pyroclast;
            total += (g.redemptor_dreadnought || 0) * POWER.redemptor_dreadnought;
        });
        if (ownedUnits.includes('librarian')) total += 1000;
        if (ownedUnits.includes('barge')) total += 10000;
        return total;
    };


    // Helper for Resources & Logging
    const modifyResources = (rpChange: number, gloryChange: number, reason: string) => {
        setResources(prev => ({ rp: Math.max(0, prev.rp + rpChange), glory: Math.max(0, prev.glory + gloryChange) }));
        if (rpChange !== 0) api.logResourceChange({ category: 'rp', amount: rpChange, reason });
        if (gloryChange !== 0) api.logResourceChange({ category: 'glory', amount: gloryChange, reason });
    };

    const modifyCorruption = (change: number, reason: string) => {
        setCorruption(prev => Math.max(0, Math.min(100, prev + change)));
        if (change !== 0) api.logResourceChange({ category: 'corruption', amount: change, reason });
    };

    const modifyAstartesResources = (changes: Partial<AstartesResources>, reason: string) => {
        setAstartes(prev => {
            const newRes = { ...prev.resources };
            let logMsg = reason + ': ';
            (Object.keys(changes) as (keyof AstartesResources)[]).forEach(k => {
                const delta = changes[k] || 0;
                newRes[k] = Math.max(0, newRes[k] + delta);
                logMsg += `${k} ${delta > 0 ? '+' : ''}${delta} `;
            });
            console.log(logMsg); // Ideally log to backend too
            return { ...prev, resources: newRes };
        });
    };

    const updateAstartes = (newState: Partial<AstartesState>) => {
        setAstartes(prev => ({ ...prev, ...newState }));
    };

    const addRitualActivity = (category: AscensionCategory, name: string, baseDifficulty: number) => {
        setAstartes(prev => {
            const currentActivities = prev.ritualActivities || RITUAL_ACTIVITIES;
            const newActivity: RitualActivity = {
                id: `dynamic-${Date.now()}`,
                name,
                category,
                baseDifficulty
            };
            const updated = {
                ...currentActivities,
                [category]: [...(currentActivities[category] || []), newActivity]
            };
            return { ...prev, ritualActivities: updated };
        });
    };

    const updateRitualActivity = (category: AscensionCategory, activityId: string, updates: Partial<RitualActivity>) => {
        setAstartes(prev => {
            const currentActivities = prev.ritualActivities || RITUAL_ACTIVITIES;
            const updated = {
                ...currentActivities,
                [category]: (currentActivities[category] || []).map(a =>
                    a.id === activityId ? { ...a, ...updates } : a
                )

            };
            return { ...prev, ritualActivities: updated };
        });
    };

    const deleteRitualActivity = (category: AscensionCategory, activityId: string) => {
        setAstartes(prev => {
            const currentActivities = prev.ritualActivities || RITUAL_ACTIVITIES;
            const updated = {
                ...currentActivities,
                [category]: (currentActivities[category] || []).filter(a => a.id !== activityId)
            };
            return { ...prev, ritualActivities: updated };
        });
    };

    // Time & Battle Resolution State
    const [currentMonth, setCurrentMonth] = useState<number>(0);
    const [sectorHistory, setSectorHistory] = useState<SectorHistory>({});
    const [isPenitentMode, setIsPenitentMode] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initial Data Fetch & Polling
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = await getToken();
                if (!token) return; // Should not happen given App structure, but safe guard

                // Load Tasks - Normalize Dates
                const tasksData = await api.getTasks(token);
                const processedTasks = tasksData.map((t: any) => ({
                    ...t,
                    dueDate: new Date(t.dueDate),
                    createdAt: new Date(t.createdAt),
                    lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined
                }));

                setTasks(processedTasks);

                // Load Projects
                const projectsData = await api.getProjects(token);
                setProjects(projectsData || []);

                // Load Game State
                const gameState = await api.getGameState(token);
                if (gameState) {
                    if (gameState.resources) setResources(gameState.resources);
                    if (gameState.corruption !== undefined) setCorruption(gameState.corruption);
                    if (gameState.ownedUnits) setOwnedUnits(Array.isArray(gameState.ownedUnits) ? gameState.ownedUnits : []);
                    // Projects are loaded separately now
                    if (gameState.armyStrength) setArmyStrength(gameState.armyStrength);
                    if (gameState.currentMonth !== undefined) setCurrentMonth(gameState.currentMonth);
                    if (gameState.sectorHistory) setSectorHistory(gameState.sectorHistory);
                    if (gameState.notificationEmail) setNotificationEmail(gameState.notificationEmail);
                    if (gameState.emailEnabled !== undefined) setEmailEnabled(gameState.emailEnabled);
                    if (gameState.astartes) {
                        const loadedAstartes = gameState.astartes;
                        // Fix: If ritualActivities is empty (default from DB), load defaults from code
                        if (!loadedAstartes.ritualActivities || Object.keys(loadedAstartes.ritualActivities).length === 0) {
                            loadedAstartes.ritualActivities = RITUAL_ACTIVITIES;
                        }
                        setAstartes(loadedAstartes);
                    }
                }
                setInitialized(true);
            } catch (err) {
                console.error("Failed to load data from Void (API)", err);
            }
        };

        if (user) {
            loadData();
            // Polling (Every 5 seconds)
            const pollTimer = setInterval(loadData, 5000);
            return () => clearInterval(pollTimer);
        }
    }, [user, getToken]);

    // Sync Game State (Optimistic Updates + Debounced Sync)
    useEffect(() => {
        if (!initialized || !user) return;

        const timer = setTimeout(async () => {
            const token = await getToken();
            if (!token) return;
            api.syncGameState({
                resources,
                corruption,
                ownedUnits,
                armyStrength,
                currentMonth,
                sectorHistory,

                isPenitentMode,
                notificationEmail,
                emailEnabled,
                astartes
            }, token).catch(err => console.error("Sync Failed", err));
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [resources, corruption, ownedUnits, armyStrength, currentMonth, sectorHistory, isPenitentMode, notificationEmail, emailEnabled, astartes, initialized, user, getToken]);

    // Sector Traits Initialization
    const getTraitForMonth = (monthId: string): PlanetaryTraitType => {
        // ... (Same Logic)
        const monthProjects = projects.filter(p => p.month === monthId);
        const count = monthProjects.length;

        if (count >= 8) return 'death';      // High Risk/Reward
        if (count >= 5) return 'forge';      // Industry
        if (count >= 3) return 'shrine';     // Faith
        if (count >= 1) return 'hive';       // Population
        return 'barren';                     // Empty
    };

    // Corruption Engine
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const todayStr = now.toLocaleDateString();

            const overdueTasks = tasks.filter(t => {
                if (t.status !== 'active') return false;

                // For recurring tasks, they are "active" if not completed today
                if (t.isRecurring) {
                    const lastCompStr = t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString() : '';
                    // If completed today, not overdue.
                    if (lastCompStr === todayStr) return false;

                    // Check dueTime
                    let deadline = new Date(t.dueDate); // Default fallback
                    if (t.dueTime) {
                        const [hours, minutes] = t.dueTime.split(':').map(Number);
                        deadline = new Date();
                        deadline.setHours(hours, minutes, 0, 0);
                    }

                    return deadline < now;
                }

                return t.dueDate < now;
            }).length;

            const currentMonthIdx = new Date().getMonth();
            const currentMonthId = `M${currentMonthIdx + 1}`;
            const currentTrait = getTraitForMonth(currentMonthId);
            const multiplier = currentTrait === 'shrine' ? 0.5 : 1;

            if (overdueTasks > 0) {
                // Check if the current month has a garrison
                const currentGarrison = armyStrength.garrisons[currentMonthId] || { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
                const hasGarrison = (currentGarrison.guardsmen || 0) + (currentGarrison.space_marine || 0) + (currentGarrison.custodes || 0) + (currentGarrison.dreadnought || 0) + (currentGarrison.baneblade || 0) > 0;

                if (hasGarrison) {
                    console.log(`Garrison in ${currentMonthId} is holding the line!`);
                    // Negate corruption increase (Defense Success)
                    // Attrition Logic: Loose troops based on overdue count (Simulated)
                    setArmyStrength(prev => {
                        const garrison = { ...prev.garrisons[currentMonthId] };
                        let damage = overdueTasks;

                        // Guardsmen take damage first
                        if (garrison.guardsmen >= damage) {
                            garrison.guardsmen -= damage;
                            damage = 0;
                        } else {
                            damage -= garrison.guardsmen;
                            garrison.guardsmen = 0;
                            // Then Marines
                            if (garrison.space_marine >= damage) {
                                garrison.space_marine -= damage;
                                damage = 0;
                            } else {
                                garrison.space_marine = Math.max(0, garrison.space_marine - damage);
                                // Damage propagates... realistically just reduce somewhat
                            }
                        }

                        const newGarrisons = { ...prev.garrisons, [currentMonthId]: garrison };
                        return {
                            ...prev,
                            garrisons: newGarrisons,
                            totalActivePower: calculateActivePower(newGarrisons)
                        };
                    });

                } else {
                    // No Garrison - Check Fortification
                    let corruptionIncrease = overdueTasks * 1 * multiplier;

                    if (fortifiedSectors.includes(currentMonthId)) {
                        corruptionIncrease *= 0.5;
                        console.log("Fortification reduced corruption gain.");
                    }

                    if (fortifiedSectors.includes(currentMonthId)) {
                        corruptionIncrease *= 0.5;
                        console.log("Fortification reduced corruption gain.");
                    }

                    modifyCorruption(corruptionIncrease, "Corruption Engine: Overdue Tasks");
                }
            }

        }, 60000); // Check every minute

        return () => clearInterval(timer);
    }, [tasks, armyStrength, fortifiedSectors]); // Added dependencies

    // Penitent Mode Trigger
    useEffect(() => {
        if (corruption >= 100) setIsPenitentMode(true);
        else if (corruption < 80 && isPenitentMode) setIsPenitentMode(false);
    }, [corruption]);

    // Actions
    const addTask = async (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring: boolean = false, dueTime?: string, ascensionCategory?: AscensionCategory, subCategory?: string) => {
        const newTask: Task = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            title,
            faction,
            difficulty,
            dueDate,
            createdAt: new Date(),
            status: 'active',
            isRecurring,
            streak: 0,
            dueTime,
            ascensionCategory,
            subCategory
        };

        // Optimistic Update
        setTasks(prev => [...prev, newTask]);

        try {
            const token = await getToken();
            if (token) await api.createTask(newTask, token);
        } catch (err) {
            console.error("Failed to sync new task", err);
            // Revert or retry logic?
        }

        // Immediate Logic: Check for Heresy (Overdue on Attribute)
        // Immediate Logic: Check for Heresy (Overdue on Attribute)
        if (dueDate < new Date()) {
            modifyCorruption(10, "Task Created: Overdue (Heresy)");
        } else {
            modifyCorruption(-1, "Task Created: Diligence");
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        try {
            const token = await getToken();
            if (token) {
                await api.updateTask(id, updates, token);
            }
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const purgeTask = async (id: string) => {
        // Optimistic
        const taskToPurge = tasks.find(t => t.id === id);
        if (taskToPurge && taskToPurge.isRecurring) {
            const now = new Date();
            let deadline = new Date(taskToPurge.dueDate);
            if (taskToPurge.dueTime) {
                const [hours, minutes] = taskToPurge.dueTime.split(':').map(Number);
                deadline = new Date();
                deadline.setHours(hours, minutes, 0, 0);
            }
            // If strictly overdue (now > deadline), reject interaction
            if (now > deadline) {
                console.warn("Task is overdue and cannot be purged.");
                return;
            }
        }

        setTasks(prev => {
            return prev.map(t => {
                if (t.id === id) {
                    if (t.isRecurring) {
                        const now = new Date();
                        const todayStr = now.toDateString(); // "Mon Jan 27 2026"
                        const lastCompStr = t.lastCompletedAt ? new Date(t.lastCompletedAt).toDateString() : '';

                        // Streak Logic
                        let newStreak = t.streak || 0;
                        let shouldReward = false;

                        if (lastCompStr === todayStr) {
                            // Already done today, don't increase streak.
                            // However, if streak is 0 for some reason, fix it to 1 if it's "Completed" today.
                            if (newStreak === 0) newStreak = 1;
                            const updatedFix = { ...t, streak: newStreak };
                            if (t.streak !== newStreak) {
                                getToken().then(token => {
                                    if (token) api.updateTask(id, { streak: newStreak }, token).catch(console.error);
                                });
                                return updatedFix;
                            }
                            return t;
                        }

                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        const yesterdayStr = yesterday.toDateString();

                        if (lastCompStr === yesterdayStr) {
                            // Consecutive day
                            newStreak += 1;
                            shouldReward = true;
                        } else {
                            // First time OR Broken streak
                            // If never completed, or missed a day -> Reset to 1 (Today counts as 1)
                            newStreak = 1;
                        }

                        // Milestone Rewards (Check ONLY if we just incremented)
                        // Note: Logic allows only 1 reward per day per task
                        if (shouldReward || newStreak === 1) { // Check rewards on increment or fresh start? Usually streaks reward on increment.
                            const streakRewards = {
                                7: { glory: 50, rp: 20, msg: "Weekly Discipline Bonus!" },
                                14: { glory: 150, rp: 50, msg: "Fortnight of Iron Will!" },
                                21: { glory: 300, rp: 75, msg: "Tricenary of Faith!" }, // 21 days
                                30: { glory: 500, rp: 100, msg: "Month of The Emperor's Grace!" }
                            };
                            // @ts-ignore
                            const reward = streakRewards[newStreak];
                            if (reward) {
                                setResources(res => ({ ...res, glory: res.glory + reward.glory, rp: res.rp + reward.rp }));
                                console.log(reward.msg); // Could trigger a toast notification here if we had one
                                // Ideally we pass this msg to UI. For now, resources update is enough.
                            }
                        }

                        const updated = { ...t, lastCompletedAt: new Date(), status: 'active' as const, streak: newStreak };
                        getToken().then(token => {
                            if (token) api.updateTask(id, { lastCompletedAt: updated.lastCompletedAt, status: 'active', streak: newStreak }, token).catch(e => console.error(e));
                        });
                        return updated;
                    }
                    getToken().then(token => {
                        if (token) api.updateTask(id, { status: 'completed' }, token).catch(e => console.error(e));
                    });
                    return { ...t, status: 'completed' as const };
                }
                return t;
            }).filter(t => {
                if (t.isRecurring) return true; // Keep recurring tasks in the state, filter in UI or logic
                return t.status !== 'completed';
            });
        });

        // Reward Logic (Standard Per Task Reward)
        let rpReward = 10;
        if (activeTacticalScan) {
            const task = tasks.find(t => t.id === id);
            if (task && task.difficulty >= 4) {
                rpReward *= 2;
                setActiveTacticalScan(false); // Consume charge
            }
        }

        const task = tasks.find(t => t.id === id);
        if (task && task.ascensionCategory) {
            const difficulty = task.difficulty || 1;
            const amount = difficulty; // Fix: 1x multiplier (1-5 points based on difficulty)
            switch (task.ascensionCategory) {
                case 'exercise': modifyAstartesResources({ adamantium: amount }, "Task: Exercise"); break;
                case 'learning': modifyAstartesResources({ neuroData: amount }, "Task: Learning"); break;
                case 'cleaning': modifyAstartesResources({ puritySeals: amount }, "Task: Cleaning"); break;
                case 'parenting': modifyAstartesResources({ geneLegacy: amount }, "Task: Parenting"); break;
            }

            // Glory Reward based on difficulty (5 per level)
            const gloryReward = difficulty * 5;
            console.log(`[Ascension] Task Completed: ${task.title} | Difficulty: ${difficulty} | Resource Amount: ${amount} | Glory Reward: ${gloryReward}`);
            modifyResources(0, gloryReward, `Ascension Task Completed: ${task.title}`);
        }

        modifyResources(rpReward, 5, `Task Completed: ${tasks.find(t => t.id === id)?.title || 'Unknown'}`);
        modifyCorruption(-2, "Task Completed: Purification");
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            const token = await getToken();
            if (token) await api.deleteTask(id, token);
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    const buyUnit = (unitId: string, cost: number) => {
        if (resources.glory >= cost && !ownedUnits.includes(unitId)) {
            modifyResources(0, -cost, `Unit Purchased: ${unitId}`);
            setOwnedUnits(prev => [...prev, unitId]);
        }
    };

    const cleanseCorruption = () => {
        if (resources.rp >= 20) {
            modifyResources(-20, 0, "Ritual: Cleanse Corruption");
            modifyCorruption(-30, "Ritual: Cleanse Corruption");
        }
    };

    const resetGame = () => {
        setCorruption(50);
        setIsPenitentMode(false);
        // Maybe trigger a backend reset?
    };

    const purchaseItem = (cost: number, type: string) => {
        if (resources.rp < cost) {
            console.warn("Insufficient RP");
            return;
        }

        modifyResources(-cost, 0, `Armory Purchase: ${type}`);

        // Execute Effects
        if (type === 'servo_skull') {
            setTasks(prev => {
                const orkTasks = prev.filter(t => t.status === 'active' && t.faction === 'orks');
                if (orkTasks.length === 0) return prev;
                const ransomIdx = Math.floor(Math.random() * orkTasks.length);
                const target = orkTasks[ransomIdx];

                // Sync effect
                // Sync effect
                getToken().then(token => {
                    if (token) api.updateTask(target.id, { status: 'completed' }, token).catch(e => console.error(e));
                });

                return prev.map(t => t.id === target.id ? { ...t, status: 'completed' } : t);
            });
        }
        else if (type === 'theme_khorne') {
            setRadarTheme('red');
        }
        else if (type === 'theme_gold') {
            setRadarTheme('gold');
        }
        else if (type === 'rosarius') {
            modifyCorruption(-50, "Item Effect: Rosarius");
        }
    };

    // Project Logic
    const addProject = (title: string, difficulty: number, month: string) => {
        const newProject: Project = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            title,
            difficulty,
            month,
            subTasks: [],
            completed: false
        };
        setProjects(prev => [...prev, newProject]);
        getToken().then(token => {
            if (token) api.createProject(newProject, token).catch(err => console.error("Failed to create project", err));
        });
        return newProject.id;
    };

    const addSubTask = (projectId: string, title: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newSubTask = { id: Date.now().toString(36) + Math.random().toString(36).substr(2), title, completed: false };
        const newSubTasks = [...(project.subTasks || []), newSubTask];

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, subTasks: newSubTasks } : p));
        getToken().then(token => {
            if (token) api.updateProject(projectId, { subTasks: newSubTasks }, token).catch(err => console.error("Failed to update project subtasks", err));
        });
    };

    const completeSubTask = (projectId: string, subTaskId: string) => {
        // Optimistic Update
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;

            let gloryGained = false;
            const updatedSubTasks = (p.subTasks || []).map(st => {
                if (st.id === subTaskId && !st.completed) {
                    gloryGained = true;
                    return { ...st, completed: true };
                }
                return st;
            });

            const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
            const isJustCompleted = allCompleted && !p.completed;

            if (gloryGained) {
                // Base Subtask Glory
                modifyResources(0, 50, "Project Subtask Completed");
            }

            if (isJustCompleted) {
                const currentMonthIdx = new Date().getMonth();
                const currentMonthId = `M${currentMonthIdx + 1}`;
                const currentTrait = getTraitForMonth(currentMonthId);
                const isDeathWorld = currentTrait === 'death';
                const isForgeWorld = currentTrait === 'forge';
                let bonus = p.difficulty * 500;
                if (isDeathWorld) bonus *= 2;
                else if (isForgeWorld) bonus = Math.floor(bonus * 1.2);

                modifyResources(0, bonus, `Project Completed: ${p.title}`);
            }

            // API Sync
            // API Sync
            getToken().then(token => {
                if (token) api.updateProject(p.id, { subTasks: updatedSubTasks, completed: allCompleted || p.completed }, token).catch(err => console.error(err));
            });

            return { ...p, subTasks: updatedSubTasks, completed: allCompleted || p.completed };
        }));
    };

    const updateSubTask = (projectId: string, subTaskId: string, title: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            const newSubTasks = p.subTasks.map(t => t.id === subTaskId ? { ...t, title } : t);
            getToken().then(token => {
                if (token) api.updateProject(p.id, { subTasks: newSubTasks }, token).catch(console.error);
            });
            return { ...p, subTasks: newSubTasks };
        }));
    };

    const deleteSubTask = (projectId: string, subTaskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            const newSubTasks = p.subTasks.filter(t => t.id !== subTaskId);
            getToken().then(token => {
                if (token) api.updateProject(p.id, { subTasks: newSubTasks }, token).catch(console.error);
            });
            return { ...p, subTasks: newSubTasks };
        }));
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        getToken().then(token => {
            if (token) api.deleteProject(projectId, token).catch(err => console.error("Failed to delete project", err));
        });
    };

    const recruitUnit = (type: UnitType) => {
        const COSTS: Record<UnitType, number> = {
            guardsmen: 300, space_marine: 1500, custodes: 4500, dreadnought: 100, baneblade: 2000,
            wolf_guard: 2000, phalanx_warder: 2000, purifier: 2000, pyroclast: 2000, redemptor_dreadnought: 10000
        };
        let cost = COSTS[type];

        const currentMonthIdx = new Date().getMonth();
        const currentMonthId = `M${currentMonthIdx + 1}`;
        const currentTrait = getTraitForMonth(currentMonthId);
        if (type === 'guardsmen' && currentTrait === 'hive') {
            cost = Math.floor(cost * 0.8);
        }

        if (resources.glory >= cost) {
            modifyResources(0, -cost, `Recruited: ${type}`);
            setArmyStrength(prev => {
                return {
                    ...prev,
                    reserves: {
                        ...prev.reserves,
                        [type]: (prev.reserves[type] || 0) + 1
                    }
                };
            });
            return true;
        }
        return false;
    };

    const deployUnit = (monthId: string, type: UnitType, count: number) => {
        setArmyStrength(prev => {
            if ((prev.reserves[type] || 0) < count) return prev;

            const newReserves = { ...prev.reserves, [type]: prev.reserves[type] - count };

            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
            const newGarrison = { ...currentGarrison, [type]: (currentGarrison[type] || 0) + count };

            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };
            const newTotalPower = calculateActivePower(newGarrisons);

            const newState = { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };

            // Force Sync
            getToken().then(token => {
                if (token) {
                    api.syncGameState({
                        resources,
                        corruption,
                        ownedUnits,
                        armyStrength: newState,
                        currentMonth,
                        sectorHistory,
                        isPenitentMode,
                        notificationEmail,
                        emailEnabled
                    }, token).catch(console.error);
                }
            });

            return newState;
        });
    };

    const recallUnit = (monthId: string, type: UnitType, count: number) => {
        setArmyStrength(prev => {
            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
            if ((currentGarrison[type] || 0) < count) return prev;

            const newGarrison = { ...currentGarrison, [type]: (currentGarrison[type] || 0) - count };
            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };

            const newReserves = { ...prev.reserves, [type]: (prev.reserves[type] || 0) + count };
            const newTotalPower = calculateActivePower(newGarrisons);

            const newState = { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };

            // Force Sync
            getToken().then(token => {
                if (token) {
                    api.syncGameState({
                        resources,
                        corruption,
                        ownedUnits,
                        armyStrength: newState,
                        currentMonth,
                        sectorHistory,
                        isPenitentMode,
                        notificationEmail,
                        emailEnabled,
                        astartes
                    }, token).catch(console.error);
                }
            });

            return newState;
        });
    };

    const grantAscensionReward = (units: UnitType[], glory: number = 0) => {
        // 1. Add to Reserves
        setArmyStrength(prev => {
            const newReserves = { ...prev.reserves };
            units.forEach(u => {
                newReserves[u] = (newReserves[u] || 0) + 1;
            });
            // Update total power is not needed as reserves don't count for defense yet, only garrisons?
            // But we should keep structure consistent.
            return { ...prev, reserves: newReserves };
        });

        // 2. Unlock Purchase Rights
        setOwnedUnits(prev => {
            const newOwned = [...prev];
            units.forEach(u => {
                const unlockKey = `unlock_${u}`;
                if (!newOwned.includes(unlockKey)) newOwned.push(unlockKey);
            });
            return newOwned;
        });

        // 3. Grant Glory
        if (glory > 0) modifyResources(0, glory, "Ascension Reward");
    };

    const activateTacticalScan = () => {
        if (resources.rp >= 15 && !activeTacticalScan) {
            modifyResources(-15, 0, "Strategic Action: Tactical Scan");
            setActiveTacticalScan(true);
        }
    };

    const fortifySector = (monthId: string) => {
        if (resources.rp >= 40 && !fortifiedSectors.includes(monthId)) {
            modifyResources(-40, 0, `Strategic Action: Fortify Sector ${monthId}`);
            setFortifiedSectors(prev => [...prev, monthId]);
        }
    };

    const triggerBattlefieldMiracle = (monthId: string) => {
        if (resources.glory >= 500) {
            // Check completion rate
            const sectorTasks = projects.filter(p => p.month === monthId);
            const total = sectorTasks.length;
            const completed = sectorTasks.filter(p => p.completed).length;
            const rate = total > 0 ? completed / total : 0;

            if (rate > 0.7) {
                modifyResources(100, -500, "Miracle: Battlefield Miracle Triggered");
                // Clear corruption logic? Global or specific?
                // "Clear all corruption penalties for that month" - usually implies sector traits or just reduce corruption massively
                modifyCorruption(-50, "Miracle: Divine Light");
                console.log("Miracle Triggered!");
            } else {
                console.warn("Faith is insufficient.");
            }
        }
    };

    const exportSTC = () => {
        const resetTime = new Date();
        const data = {
            version: '1.0',
            exportedAt: resetTime.toISOString(),
            tasks, resources, corruption, ownedUnits, radarTheme, projects, armyStrength, currentMonth, sectorHistory
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emperor-save-${resetTime.toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importSTC = async (jsonData: string) => {
        try {
            const data = JSON.parse(jsonData);
            if (!data.tasks || !data.resources) throw new Error("Invalid STC Data");

            // 1. Update Local State (Optimistic)
            const importedTasks = data.tasks.map((t: any) => ({
                ...t,
                dueDate: new Date(t.dueDate),
                createdAt: new Date(t.createdAt),
                lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined
            }));

            setTasks(importedTasks);
            setResources(data.resources);
            setCorruption(data.corruption || 0);
            setOwnedUnits(Array.isArray(data.ownedUnits) ? data.ownedUnits : []);
            setRadarTheme(data.radarTheme || 'green');
            setProjects(data.projects || []);
            setArmyStrength(data.armyStrength || { reserves: { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 }, garrisons: {}, totalActivePower: 0 });

            setCurrentMonth(data.currentMonth !== undefined ? data.currentMonth : new Date().getMonth());
            setSectorHistory(data.sectorHistory || {});

            // 2. Sync to Backend (Migration)
            console.log("Starting STC Cloud Migration...");

            // Sync Game State
            await api.syncGameState({
                resources: data.resources,
                corruption: data.corruption,
                ownedUnits: data.ownedUnits,
                armyStrength: data.armyStrength,
                currentMonth: data.currentMonth,
                sectorHistory: data.sectorHistory,
                isPenitentMode: data.isPenitentMode
            }, await getToken() || undefined);

            // Sync Tasks (Loop)
            for (const task of data.tasks) {
                try {
                    await api.createTask({
                        ...task,
                        dueDate: task.dueDate, // Date object or string? Interface says Date, but JSON is string. api.createTask expects Task which has Date. 
                        // JSON.stringify handles Date -> subtask string.
                        // Our api.createTask body stringify handles it.
                    });
                } catch (e) {
                    // Ignore existence errors or update?
                    // Try update if create fails?
                    // Assuming create ID conflict might fail depending on DB.
                    // For now, assume fresh DB.
                }
            }

            // Sync Projects
            if (data.projects) {
                for (const proj of data.projects) {
                    try {
                        await api.createProject(proj);
                    } catch (e) {
                        console.warn("Project sync warning:", e);
                    }
                }
            }

            alert("STC Data Imported & Synced to Void (Server).");
        } catch (error) {
            console.error("STC Import Failed:", error);
            alert("STC Import Failed: " + error);
        }
    };

    const resolveSector = (monthId: string) => {
        const targetMonthIdx = parseInt(monthId.slice(1)) - 1;
        if (targetMonthIdx !== currentMonth) {
            console.warn("Commander, you can only resolve the CURRENT sector.");
            return;
        }
        const scalingThreat = Math.floor(500 * Math.pow(1.52, targetMonthIdx));
        const garrison = armyStrength.garrisons[monthId] || { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
        const garrisonPower = calculateActivePower({ [monthId]: garrison });
        const isVictory = garrisonPower >= scalingThreat;

        const result: BattleResult = isVictory ? 'victory' : 'defeat';

        if (isVictory) {
            modifyResources(0, 500, "Battle Victory");
        } else {
            modifyCorruption(20, "Battle Defeat");
        }

        setSectorHistory(prev => ({ ...prev, [monthId]: result }));
        setCurrentMonth(prev => (prev + 1) % 12);
    };

    const advanceMonth = () => {
        setCurrentMonth(prev => (prev + 1) % 12);
    };

    // Debug Actions
    const debugSetResources = (res: Resources) => {
        // Calculate deltas for logging
        const rpDelta = res.rp - resources.rp;
        const gloryDelta = res.glory - resources.glory;
        setResources(res);
        if (rpDelta !== 0) api.logResourceChange({ category: 'rp', amount: rpDelta, reason: "GM Override" });
        if (gloryDelta !== 0) api.logResourceChange({ category: 'glory', amount: gloryDelta, reason: "GM Override" });
    };
    const debugSetCorruption = (val: number) => {
        const delta = val - corruption;
        setCorruption(val);
        api.logResourceChange({ category: 'corruption', amount: delta, reason: "GM Override" });
    };
    const debugSetArmyStrength = (army: ArmyStrength) => setArmyStrength(army);

    return (
        <GameContext.Provider value={{
            tasks: tasks.filter(t => {
                if (!t.isRecurring) return t.status === 'active';
                if (!t.lastCompletedAt) return true;
                const lastComp = new Date(t.lastCompletedAt).toLocaleDateString();
                const now = new Date().toLocaleDateString();
                return lastComp !== now;
            }),
            resources, corruption, ownedUnits, isPenitentMode,
            addTask, updateTask, purgeTask, deleteTask, buyUnit, cleanseCorruption, resetGame,
            radarTheme, purchaseItem,
            viewMode, setViewMode, projects, addProject,
            addSubTask, completeSubTask, updateSubTask, deleteSubTask, deleteProject, recruitUnit,
            deployUnit, recallUnit,
            armyStrength,
            getTraitForMonth, exportSTC, importSTC,
            currentMonth, sectorHistory, resolveSector, advanceMonth,
            allTasks: tasks,
            activeTacticalScan, activateTacticalScan, fortifiedSectors, fortifySector, triggerBattlefieldMiracle,
            debugSetResources, debugSetCorruption, debugSetArmyStrength,
            notificationEmail, emailEnabled, updateSettings,
            modifyResources, modifyCorruption,
            astartes, modifyAstartesResources, updateAstartes, grantAscensionReward,
            addRitualActivity, updateRitualActivity, deleteRitualActivity
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
