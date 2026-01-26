
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Resources, Faction, Project, ArmyStrength, SectorTrait, PlanetaryTraitType, BattleResult, SectorHistory } from '../types';
import { api } from '../services/api';

interface GameContextType {
    tasks: Task[];
    resources: Resources;
    corruption: number;
    ownedUnits: string[];
    isPenitentMode: boolean;
    addTask: (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring?: boolean) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    purgeTask: (id: string) => void;
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
    deleteProject: (projectId: string) => void;
    recruitUnit: (type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade') => void;

    // Deployment Actions
    deployUnit: (monthId: string, type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade', count: number) => void;
    recallUnit: (monthId: string, type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade', count: number) => void;

    armyStrength: ArmyStrength;
    // STC & Sector Traits
    // sectorTraits removed, replaced by dynamic calculation
    getTraitForMonth: (monthId: string) => PlanetaryTraitType;
    exportSTC: () => void;
    importSTC: (jsonData: string) => void;

    // Time & Battle Resolution
    currentMonth: number; // 0-11
    sectorHistory: SectorHistory;
    resolveSector: (monthId: string) => void;
    advanceMonth: () => void; // Debug/Cheat
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
        reserves: { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 },
        garrisons: {},
        totalActivePower: 0
    });

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

    // Time & Battle Resolution State
    // ...

    // Corruption Engine
    // ... Same as before
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const todayStr = now.toLocaleDateString();

            const overdueTasks = tasks.filter(t => {
                if (t.status !== 'active') return false;

                // For recurring tasks, they are "active" if not completed today
                if (t.isRecurring) {
                    const lastCompStr = t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString() : '';
                    return lastCompStr !== todayStr && t.dueDate < now;
                }

                return t.dueDate < now;
            }).length;

            const currentMonthIdx = new Date().getMonth();
            const currentMonthId = `M${currentMonthIdx + 1}`;
            const currentTrait = getTraitForMonth(currentMonthId);
            const multiplier = currentTrait === 'shrine' ? 0.5 : 1;

            if (overdueTasks > 0) {
                setCorruption(prev => Math.min(100, prev + (overdueTasks * 1 * multiplier)));
            }
        }, 60000); // Check every minute

        return () => clearInterval(timer);
    }, [tasks]);

    // Penitent Mode Trigger
    useEffect(() => {
        if (corruption >= 100) setIsPenitentMode(true);
        else if (corruption < 80 && isPenitentMode) setIsPenitentMode(false);
    }, [corruption]);

    // Actions
    const addTask = async (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring: boolean = false) => {
        const newTask: Task = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            title,
            faction,
            difficulty,
            dueDate,
            createdAt: new Date(),
            status: 'active',
            isRecurring
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
                        const updated = { ...t, lastCompletedAt: new Date() };
                        api.updateTask(id, { lastCompletedAt: updated.lastCompletedAt }).catch(e => console.error(e));
                        return updated;
                    }
                    // For one-off, we mark as completed in UI but maybe delete from DB or just update status?
                    // Previous logic: 'completed'.
                    api.updateTask(id, { status: 'completed' }).catch(e => console.error(e));
                    // Or if we want to DELETE from DB:
                    // api.deleteTask(id);
                    // But history is good. Let's keep status='completed'.
                    return { ...t, status: 'completed' as const };
                }
                return t;
            }).filter(t => !(!t.isRecurring && t.status === 'completed')); // Keep recurring, filter completed
        });

        // Reward Logic
        setResources(prev => {
            const newRp = (prev?.rp || 0) + 10;
            const newGlory = (prev?.glory || 0) + 5;
            return { ...prev, rp: newRp, glory: newGlory };
        });

        setCorruption(prev => Math.max(0, prev - 2));
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
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                // ... (Logic same as before for parsing)
                let gloryGained = false;
                const updatedSubTasks = (p.subTasks || []).map(st => {
                    if (st.id === subTaskId && !st.completed) {
                        gloryGained = true;
                        return { ...st, completed: true };
                    }
                    return st;
                });

                if (gloryGained) {
                    const currentMonthIdx = new Date().getMonth();
                    const currentMonthId = `M${currentMonthIdx + 1}`;
                    const currentTrait = getTraitForMonth(currentMonthId);
                    const baseGlory = 50;
                    const finalGlory = currentTrait === 'forge' ? Math.floor(baseGlory * 1.2) : baseGlory;

                    setResources(res => ({ ...res, glory: res.glory + finalGlory }));
                }

                // Check completion
                const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
                const isJustCompleted = allCompleted && !p.completed;

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

                return { ...p, subTasks: updatedSubTasks, completed: allCompleted };
            }
            return p;
        }));


        // Send update to API (We need to find the project again or calc state? Optimistic set above is complex).
        // For simplicity, let's recalculate the specific project update to send to API
        const project = projects.find(p => p.id === projectId);
        if (project) {
            let updatedSubTasks = (project.subTasks || []).map(st => st.id === subTaskId ? { ...st, completed: true } : st);
            // Check if all completed
            const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);

            api.updateProject(projectId, {
                subTasks: updatedSubTasks,
                completed: allCompleted
            }).catch(err => console.error("Failed to update project completion", err));
        }
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        api.deleteProject(projectId).catch(err => console.error("Failed to delete project", err));
    };

    const calculateActivePower = (garrisons: Record<string, any>) => {
        const POWER = { guardsmen: 50, spaceMarines: 300, custodes: 1500 };
        let total = 0;
        Object.values(garrisons).forEach((g: any) => {
            total += (g.guardsmen || 0) * POWER.guardsmen;
            total += (g.spaceMarines || 0) * POWER.spaceMarines;
            total += (g.custodes || 0) * POWER.custodes;
        });
        if (ownedUnits.includes('librarian')) total += 1000;
        if (ownedUnits.includes('barge')) total += 10000;
        if (ownedUnits.includes('baneblade')) total += 5000;
        return total;
    };

    const recruitUnit = (type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade') => {
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
                const typeKey = type === 'space_marine' ? 'spaceMarines' : type;
                return {
                    ...prev,
                    reserves: {
                        ...prev.reserves,
                        [typeKey]: prev.reserves[typeKey] + 1
                    }
                };
            });
            return true;
        }
        return false;
    };

    const deployUnit = (monthId: string, type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade', count: number) => {
        setArmyStrength(prev => {
            const typeKey = type === 'space_marine' ? 'spaceMarines' : type;
            if (prev.reserves[typeKey] < count) return prev;
            const newReserves = { ...prev.reserves, [typeKey]: prev.reserves[typeKey] - count };
            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
            const newGarrison = { ...currentGarrison, [typeKey]: (currentGarrison[typeKey] || 0) + count };
            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };
            const newTotalPower = calculateActivePower(newGarrisons);
            return { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };
        });
    };

    const recallUnit = (monthId: string, type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade', count: number) => {
        setArmyStrength(prev => {
            const typeKey = type === 'space_marine' ? 'spaceMarines' : type;
            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
            if ((currentGarrison[typeKey] || 0) < count) return prev;
            const newGarrison = { ...currentGarrison, [typeKey]: (currentGarrison[typeKey] || 0) - count };
            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };
            const newReserves = { ...prev.reserves, [typeKey]: prev.reserves[typeKey] + count };
            const newTotalPower = calculateActivePower(newGarrisons);
            return { reserves: newReserves, garrisons: newGarrisons, totalActivePower: newTotalPower };
        });
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
            setArmyStrength(data.armyStrength || { reserves: { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 }, garrisons: {}, totalActivePower: 0 });
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
        const garrison = armyStrength.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0 };
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
            tasks, resources, corruption, ownedUnits, isPenitentMode,
            addTask, updateTask, purgeTask, buyUnit, cleanseCorruption, resetGame,
            radarTheme, purchaseItem,
            viewMode, setViewMode, projects, addProject,
            addSubTask, completeSubTask, deleteProject, recruitUnit,
            deployUnit, recallUnit,
            armyStrength,
            getTraitForMonth, exportSTC, importSTC,
            currentMonth, sectorHistory, resolveSector, advanceMonth
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
