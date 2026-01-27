
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Resources, Faction, Project, ArmyStrength, SectorTrait, PlanetaryTraitType, BattleResult, SectorHistory, UnitType } from '../types';
import { api } from '../services/api';

interface GameContextType {
    tasks: Task[];
    resources: Resources;
    corruption: number;
    ownedUnits: string[];
    isPenitentMode: boolean;
    addTask: (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring?: boolean, dueTime?: string) => void;
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

    // STC
    exportSTC: () => void;
    importSTC: (jsonData: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State Initialization
    const [tasks, setTasks] = useState<Task[]>([]);
    const [resources, setResources] = useState<Resources>({ rp: 0, glory: 0 });
    const [corruption, setCorruption] = useState<number>(0);
    const [ownedUnits, setOwnedUnits] = useState<string[]>([]);
    const [radarTheme, setRadarTheme] = useState<string>('green');

    // Strategic Mode States
    const [viewMode, setViewMode] = useState<'tactical' | 'strategic'>('tactical');
    const [projects, setProjects] = useState<Project[]>([]);

    const [armyStrength, setArmyStrength] = useState<ArmyStrength>({
        reserves: { guardsmen: 0, space_marine: 0, custodes: 0, dreadnought: 0, baneblade: 0 },
        garrisons: {},
        totalActivePower: 0
    });
    const [activeTacticalScan, setActiveTacticalScan] = useState(false);
    const [fortifiedSectors, setFortifiedSectors] = useState<string[]>([]);

    const calculateActivePower = (garrisons: Record<string, Record<UnitType, number>>) => {
        const POWER = { guardsmen: 50, space_marine: 300, custodes: 1500, dreadnought: 500, baneblade: 5000 };
        let total = 0;
        Object.values(garrisons).forEach((g) => {
            total += (g.guardsmen || 0) * POWER.guardsmen;
            total += (g.space_marine || 0) * POWER.space_marine;
            total += (g.custodes || 0) * POWER.custodes;
            total += (g.dreadnought || 0) * POWER.dreadnought;
            total += (g.baneblade || 0) * POWER.baneblade;
        });
        if (ownedUnits.includes('librarian')) total += 1000;
        if (ownedUnits.includes('barge')) total += 10000;
        return total;
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
                // Load Tasks - Normalize Dates
                const tasksData = await api.getTasks();
                const processedTasks = tasksData.map((t: any) => ({
                    ...t,
                    dueDate: new Date(t.dueDate),
                    createdAt: new Date(t.createdAt),
                    lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined
                }));

                setTasks(processedTasks);

                // Load Projects
                const projectsData = await api.getProjects();
                setProjects(projectsData || []);

                // Load Game State
                const gameState = await api.getGameState();
                if (gameState) {
                    if (gameState.resources) setResources(gameState.resources);
                    if (gameState.corruption !== undefined) setCorruption(gameState.corruption);
                    if (gameState.ownedUnits) setOwnedUnits(Array.isArray(gameState.ownedUnits) ? gameState.ownedUnits : []);
                    // Projects are loaded separately now
                    if (gameState.armyStrength) setArmyStrength(gameState.armyStrength);
                    if (gameState.currentMonth !== undefined) setCurrentMonth(gameState.currentMonth);
                    if (gameState.sectorHistory) setSectorHistory(gameState.sectorHistory);
                }
                setInitialized(true);
            } catch (err) {
                console.error("Failed to load data from Void (API)", err);
            }
        };

        loadData();

        // Polling (Every 5 seconds)
        const pollTimer = setInterval(loadData, 5000);

        return () => clearInterval(pollTimer);
    }, []);

    // Sync Game State (Optimistic Updates + Debounced Sync)
    useEffect(() => {
        if (!initialized) return;

        const timer = setTimeout(() => {
            api.syncGameState({
                resources,
                corruption,
                ownedUnits,
                armyStrength,
                currentMonth,
                sectorHistory,
                isPenitentMode
            }).catch(err => console.error("Sync Failed", err));
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [resources, corruption, ownedUnits, armyStrength, currentMonth, sectorHistory, isPenitentMode, initialized]);

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

                    setCorruption(prev => Math.min(100, prev + corruptionIncrease));
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
    const addTask = async (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring: boolean = false, dueTime?: string) => {
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
            dueTime
        };

        // Optimistic Update
        setTasks(prev => [...prev, newTask]);

        try {
            await api.createTask(newTask);
        } catch (err) {
            console.error("Failed to sync new task", err);
            // Revert or retry logic?
        }

        // Immediate Logic: Check for Heresy (Overdue on Attribute)
        if (dueDate < new Date()) {
            setCorruption(prev => Math.min(100, prev + 10));
        } else {
            setCorruption(prev => Math.max(0, prev - 1));
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        try {
            await api.updateTask(id, updates);
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const purgeTask = async (id: string) => {
        // Optimistic
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
                                api.updateTask(id, { streak: newStreak }).catch(console.error);
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
                        api.updateTask(id, { lastCompletedAt: updated.lastCompletedAt, status: 'active', streak: newStreak }).catch(e => console.error(e));
                        return updated;
                    }
                    api.updateTask(id, { status: 'completed' }).catch(e => console.error(e));
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
        setResources(prev => {
            const newRp = (prev?.rp || 0) + rpReward;
            const newGlory = (prev?.glory || 0) + 5;
            return { ...prev, rp: newRp, glory: newGlory };
        });

        setCorruption(prev => Math.max(0, prev - 2));
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            await api.deleteTask(id);
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    const buyUnit = (unitId: string, cost: number) => {
        if (resources.glory >= cost && !ownedUnits.includes(unitId)) {
            setResources(prev => ({ ...prev, glory: prev.glory - cost }));
            setOwnedUnits(prev => [...prev, unitId]);
        }
    };

    const cleanseCorruption = () => {
        if (resources.rp >= 20) {
            setResources(prev => ({ ...prev, rp: prev.rp - 20 }));
            setCorruption(prev => Math.max(0, prev - 30));
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

        setResources(prev => ({ ...prev, rp: prev.rp - cost }));

        // Execute Effects
        if (type === 'servo_skull') {
            setTasks(prev => {
                const orkTasks = prev.filter(t => t.status === 'active' && t.faction === 'orks');
                if (orkTasks.length === 0) return prev;
                const ransomIdx = Math.floor(Math.random() * orkTasks.length);
                const target = orkTasks[ransomIdx];

                // Sync effect
                api.updateTask(target.id, { status: 'completed' }).catch(e => console.error(e));

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
            setCorruption(prev => Math.max(0, prev - 50));
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
        api.createProject(newProject).catch(err => console.error("Failed to create project", err));
        return newProject.id;
    };

    const addSubTask = (projectId: string, title: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newSubTask = { id: Date.now().toString(36) + Math.random().toString(36).substr(2), title, completed: false };
        const newSubTasks = [...(project.subTasks || []), newSubTask];

        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, subTasks: newSubTasks } : p));
        api.updateProject(projectId, { subTasks: newSubTasks }).catch(err => console.error("Failed to update project subtasks", err));
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
                setResources(res => ({ ...res, glory: res.glory + 50 }));
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

                setResources(res => ({ ...res, glory: res.glory + bonus }));
            }

            // API Sync
            api.updateProject(p.id, { subTasks: updatedSubTasks, completed: allCompleted || p.completed }).catch(err => console.error(err));

            return { ...p, subTasks: updatedSubTasks, completed: allCompleted || p.completed };
        }));
    };

    const updateSubTask = (projectId: string, subTaskId: string, title: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            const newSubTasks = p.subTasks.map(t => t.id === subTaskId ? { ...t, title } : t);
            api.updateProject(p.id, { subTasks: newSubTasks }).catch(console.error);
            return { ...p, subTasks: newSubTasks };
        }));
    };

    const deleteSubTask = (projectId: string, subTaskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            const newSubTasks = p.subTasks.filter(t => t.id !== subTaskId);
            api.updateProject(p.id, { subTasks: newSubTasks }).catch(console.error);
            return { ...p, subTasks: newSubTasks };
        }));
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        api.deleteProject(projectId).catch(err => console.error("Failed to delete project", err));
    };

    const recruitUnit = (type: UnitType) => {
        const COSTS = { guardsmen: 10, space_marine: 50, custodes: 1000, dreadnought: 100, baneblade: 2000 };
        let cost = COSTS[type];

        const currentMonthIdx = new Date().getMonth();
        const currentMonthId = `M${currentMonthIdx + 1}`;
        const currentTrait = getTraitForMonth(currentMonthId);
        if (type === 'guardsmen' && currentTrait === 'hive') {
            cost = Math.floor(cost * 0.8);
        }

        if (resources.glory >= cost) {
            setResources(prev => ({ ...prev, glory: prev.glory - cost }));
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

            return { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };
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

            return { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };
        });
    };

    const activateTacticalScan = () => {
        if (resources.rp >= 15 && !activeTacticalScan) {
            setResources(prev => ({ ...prev, rp: prev.rp - 15 }));
            setActiveTacticalScan(true);
        }
    };

    const fortifySector = (monthId: string) => {
        if (resources.rp >= 40 && !fortifiedSectors.includes(monthId)) {
            setResources(prev => ({ ...prev, rp: prev.rp - 40 }));
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
                setResources(prev => ({ ...prev, glory: prev.glory - 500, rp: prev.rp + 100 }));
                // Clear corruption logic? Global or specific?
                // "Clear all corruption penalties for that month" - usually implies sector traits or just reduce corruption massively
                setCorruption(prev => Math.max(0, prev - 50));
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
            });

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
            setResources(prev => ({ ...prev, glory: prev.glory + 500 }));
        } else {
            setCorruption(prev => Math.min(100, prev + 20));
        }

        setSectorHistory(prev => ({ ...prev, [monthId]: result }));
        setCurrentMonth(prev => (prev + 1) % 12);
    };

    const advanceMonth = () => {
        setCurrentMonth(prev => (prev + 1) % 12);
    };

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
            activeTacticalScan, activateTacticalScan, fortifiedSectors, fortifySector, triggerBattlefieldMiracle
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
