import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Resources, Faction, Project, ArmyStrength, SectorTrait, PlanetaryTraitType, BattleResult, SectorHistory } from '../types';

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

const STORAGE_KEY = 'emperor_cogitator_v1';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State Initialization with Lazy Loading from LocalStorage
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
            if (saved) {
                return JSON.parse(saved).map((t: any) => ({
                    ...t,
                    dueDate: new Date(t.dueDate),
                    createdAt: new Date(t.createdAt),
                    lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined
                }));
            }
        } catch (e) {
            console.error("Failed to parse tasks", e);
        }
        return [];
    });

    const [resources, setResources] = useState<Resources>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_resources`);
            const parsed = saved ? JSON.parse(saved) : null;
            if (parsed && typeof parsed.rp === 'number' && typeof parsed.glory === 'number') {
                return parsed;
            }
        } catch (e) {
            console.error("Failed to load resources", e);
        }
        return { rp: 0, glory: 0 };
    });

    const [corruption, setCorruption] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_corruption`);
            return saved ? JSON.parse(saved) : 0;
        } catch (e) {
            console.error("Failed to parse corruption", e);
            return 0;
        }
    });

    const [ownedUnits, setOwnedUnits] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_units`);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse ownedUnits", e);
            return [];
        }
    });

    const [radarTheme, setRadarTheme] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_theme`);
            return saved ? JSON.parse(saved) : 'green';
        } catch (e) {
            console.error("Failed to parse radarTheme", e);
            return 'green';
        }
    });

    // Strategic Mode States
    const [viewMode, setViewMode] = useState<'tactical' | 'strategic'>('tactical');

    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_projects`);
            const loaded = saved ? JSON.parse(saved) : [];
            // Sanitize legacy data
            return loaded.map((p: any) => ({
                ...p,
                subTasks: Array.isArray(p.subTasks) ? p.subTasks : []
            }));
        } catch (e) {
            console.error("Failed to parse projects", e);
            return [];
        }
    });

    const [armyStrength, setArmyStrength] = useState<ArmyStrength>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_army`);
            if (!saved) return {
                reserves: { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 },
                garrisons: {},
                totalActivePower: 0
            };

            const parsed = JSON.parse(saved);

            // Migration Strategy: If old structure (flat numbers), move all to Reserves
            if (typeof parsed.guardsmen === 'number') {
                console.log("Migrating Legacy Army Data...");
                return {
                    reserves: {
                        guardsmen: parsed.guardsmen || 0,
                        spaceMarines: parsed.spaceMarines || 0,
                        custodes: parsed.custodes || 0,
                        dreadnought: 0,
                        baneblade: 0
                    },
                    garrisons: {},
                    totalActivePower: 0 // Previously recruited units in reserves don't count for Active Defense
                };
            }
            return parsed;
        } catch (e) {
            console.error("Failed to parse armyStrength", e);
            return { reserves: { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 }, garrisons: {}, totalActivePower: 0 };
        }
    });

    // Sector Traits Initialization
    // Dynamic Trait Logic (Replaces SectorTraits State)
    const getTraitForMonth = (monthId: string): PlanetaryTraitType => {
        const monthProjects = projects.filter(p => p.month === monthId);
        const count = monthProjects.length;

        if (count >= 8) return 'death';      // High Risk/Reward
        if (count >= 5) return 'forge';      // Industry
        if (count >= 3) return 'shrine';     // Faith
        if (count >= 1) return 'hive';       // Population
        return 'barren';                     // Empty
    };

    // Time & Battle Resolution State
    const [currentMonth, setCurrentMonth] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_currentMonth`);
            return saved ? JSON.parse(saved) : new Date().getMonth(); // Default to real-world month
        } catch (e) {
            return 0;
        }
    });

    const [sectorHistory, setSectorHistory] = useState<SectorHistory>(() => {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY}_history`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [isPenitentMode, setIsPenitentMode] = useState(false);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_resources`, JSON.stringify(resources));
    }, [resources]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_corruption`, JSON.stringify(corruption));
    }, [corruption]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(ownedUnits));
    }, [ownedUnits]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_theme`, JSON.stringify(radarTheme));
    }, [radarTheme]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_army`, JSON.stringify(armyStrength));
    }, [armyStrength]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_currentMonth`, JSON.stringify(currentMonth));
    }, [currentMonth]);

    useEffect(() => {
        localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(sectorHistory));
    }, [sectorHistory]);

    // Removed SectorTraits effect

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
                    return lastCompStr !== todayStr && t.dueDate < now;
                }

                return t.dueDate < now;
            }).length;

            // Corruption Formula: Overdue tasks increase corruption (+1 per task per minute)
            // Shrine World Effect: Halve corruption gain if *Current Month* is Shrine
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
    const addTask = (title: string, faction: Faction, difficulty: number, dueDate: Date, isRecurring: boolean = false) => {
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
        setTasks(prev => [...prev, newTask]);

        // Immediate Logic: Check for Heresy (Overdue on Attribute)
        if (dueDate < new Date()) {
            // Immediate penalty for adding an already overdue task
            setCorruption(prev => Math.min(100, prev + 10));
        } else {
            // Adding a valid task slightly reduces corruption (Hope)
            setCorruption(prev => Math.max(0, prev - 1));
        }
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const purgeTask = (id: string) => {
        console.log("Attempting to purge task:", id);
        setTasks(prev => {
            return prev.map(t => {
                if (t.id === id) {
                    if (t.isRecurring) {
                        return { ...t, lastCompletedAt: new Date() };
                    }
                    return { ...t, status: 'completed' as const };
                }
                return t;
            }).filter(t => !(!t.isRecurring && t.status === 'completed')); // Keep recurring, remove completed one-offs
        });

        // Reward Logic: Fixed +10 RP per task
        setResources(prev => {
            const newRp = (prev?.rp || 0) + 10;
            const newGlory = (prev?.glory || 0) + 5; // Small Glory Reward for Daily Tasks
            console.log(`Purge Reward: RP ${prev?.rp} -> ${newRp}, Glory ${prev?.glory} -> ${newGlory}`);
            return { ...prev, rp: newRp, glory: newGlory };
        });

        // Small hidden corruption reduction on purge
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
    };

    const purchaseItem = (cost: number, type: string) => {
        if (resources.rp < cost) {
            console.warn("Insufficient RP");
            return;
        }

        setResources(prev => ({ ...prev, rp: prev.rp - cost }));

        // Execute Effects
        if (type === 'servo_skull') {
            // Auto complete one 'orks' task
            setTasks(prev => {
                const orkTasks = prev.filter(t => t.status === 'active' && t.faction === 'orks');
                if (orkTasks.length === 0) return prev;
                const ransomIdx = Math.floor(Math.random() * orkTasks.length);
                const target = orkTasks[ransomIdx];
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
        return newProject.id;
    };

    const addSubTask = (projectId: string, title: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    subTasks: [...(p.subTasks || []), { id: Date.now().toString(36) + Math.random().toString(36).substr(2), title, completed: false }]
                };
            }
            return p;
        }));
    };

    const completeSubTask = (projectId: string, subTaskId: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === projectId) {
                let gloryGained = false;
                const updatedSubTasks = (p.subTasks || []).map(st => {
                    if (st.id === subTaskId && !st.completed) {
                        gloryGained = true;
                        return { ...st, completed: true };
                    }
                    return st;
                });

                if (gloryGained) {
                    // Forge World Effect: +20% Glory
                    const currentMonthIdx = new Date().getMonth();
                    const currentMonthId = `M${currentMonthIdx + 1}`;
                    const currentTrait = getTraitForMonth(currentMonthId);
                    const baseGlory = 50;
                    const finalGlory = currentTrait === 'forge' ? Math.floor(baseGlory * 1.2) : baseGlory;

                    setResources(res => ({ ...res, glory: res.glory + finalGlory }));
                }

                // Check if ALL subtasks are completed logic
                const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
                const isJustCompleted = allCompleted && !p.completed;

                if (isJustCompleted) {
                    const currentMonthIdx = new Date().getMonth();
                    const currentMonthId = `M${currentMonthIdx + 1}`;
                    const currentTrait = getTraitForMonth(currentMonthId);

                    // Death World Effect: Double Glory for Project Completion
                    const isDeathWorld = currentTrait === 'death';
                    // Forge World Effect: +20%
                    const isForgeWorld = currentTrait === 'forge';

                    let bonus = p.difficulty * 500;
                    if (isDeathWorld) bonus *= 2;
                    else if (isForgeWorld) bonus = Math.floor(bonus * 1.2);

                    setResources(res => ({ ...res, glory: res.glory + bonus }));
                    console.log(`Project Complete Bonus: ${bonus} Glory (Traits: ${currentTrait})`);
                }

                return { ...p, subTasks: updatedSubTasks, completed: allCompleted };
            }
            return p;
        }));
    };

    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const calculateActivePower = (garrisons: Record<string, any>) => {
        const POWER = { guardsmen: 50, spaceMarines: 300, custodes: 1500 };
        let total = 0;

        // Garrison Power
        Object.values(garrisons).forEach((g: any) => {
            total += (g.guardsmen || 0) * POWER.guardsmen;
            total += (g.spaceMarines || 0) * POWER.spaceMarines;
            total += (g.custodes || 0) * POWER.custodes;
        });

        // Global Passive Buffs from Armory (Owned Units)
        // These units contribute to defense across ALL sectors (representing their mobility or global influence)
        // Or simply add to the "Active Power" metric displayed.
        if (ownedUnits.includes('librarian')) total += 1000;
        if (ownedUnits.includes('barge')) total += 10000;
        if (ownedUnits.includes('baneblade')) total += 5000; // If Baneblade is treated as a unique asset here too, or just recruit unit.
        // Note: Baneblade in UnitShop calls recruitUnit('custodes') currently, so it counts as 1 Soldier of Custodes level power (1500).
        // If we want it to be a unique owned unit, we need to change UnitShop to buyUnit('baneblade') instead.
        // User asked for "Units purchased here".
        // Let's stick to the current logic: Librarian and Barge are unique "ownedUnits".

        return total;
    };

    const recruitUnit = (type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade') => {
        // Aligned with UnitShop.tsx costs
        const COSTS = { guardsmen: 10, space_marine: 50, custodes: 1000, dreadnought: 100, baneblade: 2000 };
        // NOTE: Spending Glory adds to RESERVES. Does NOT increase totalPower (Active Defense) yet.

        let cost = COSTS[type];

        // Hive World Effect: -20% Guard Cost
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

            // Validation
            if (prev.reserves[typeKey] < count) return prev;

            const newReserves = { ...prev.reserves, [typeKey]: prev.reserves[typeKey] - count };

            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };
            const newGarrison = { ...currentGarrison, [typeKey]: (currentGarrison[typeKey] || 0) + count };

            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };
            const newTotalPower = calculateActivePower(newGarrisons);

            return {
                reserves: newReserves,
                garrisons: newGarrisons,
                totalActivePower: newTotalPower
            };
        });
    };

    const recallUnit = (monthId: string, type: 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade', count: number) => {
        setArmyStrength(prev => {
            const typeKey = type === 'space_marine' ? 'spaceMarines' : type;
            const currentGarrison = prev.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 };

            // Validation
            if ((currentGarrison[typeKey] || 0) < count) return prev;

            const newGarrison = { ...currentGarrison, [typeKey]: (currentGarrison[typeKey] || 0) - count };
            const newGarrisons = { ...prev.garrisons, [monthId]: newGarrison };

            const newReserves = { ...prev.reserves, [typeKey]: prev.reserves[typeKey] + count };
            const newTotalPower = calculateActivePower(newGarrisons);

            return {
                reserves: newReserves,
                garrisons: newGarrisons,
                totalActivePower: newTotalPower
            };
        });
    };

    // STC Protocol
    const exportSTC = () => {
        const resetTime = new Date();
        const data = {
            version: '1.0',
            exportedAt: resetTime.toISOString(),
            tasks,
            resources,
            corruption,
            ownedUnits,
            radarTheme,
            projects,
            armyStrength,
            currentMonth,
            sectorHistory
            // sectorTraits removed
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emperor-save-${resetTime.toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        // Sync currentMonth with real time if no save exists? 
        // For now, let's trust the state or manual advance.
    }, []);

    // Battle Resolution Logic
    const resolveSector = (monthId: string) => {
        // Validation
        const targetMonthIdx = parseInt(monthId.slice(1)) - 1;
        if (targetMonthIdx !== currentMonth) {
            console.warn("Commander, you can only resolve the CURRENT sector.");
            return;
        }

        // Calculate Outcome
        const scalingThreat = Math.floor(500 * Math.pow(1.52, targetMonthIdx));
        const garrison = armyStrength.garrisons[monthId] || { guardsmen: 0, spaceMarines: 0, custodes: 0 };
        const garrisonPower = calculateActivePower({ [monthId]: garrison });

        const isVictory = garrisonPower >= scalingThreat;
        const result: BattleResult = isVictory ? 'victory' : 'defeat';

        // Apply Consequences
        if (isVictory) {
            // Victory Reward
            setResources(prev => ({ ...prev, glory: prev.glory + 500 }));
            // Play victory sound need to be triggered in UI, here we just update state
        } else {
            // Defeat Penalty
            setCorruption(prev => Math.min(100, prev + 20));
        }

        // Update History & Advance
        setSectorHistory(prev => ({ ...prev, [monthId]: result }));
        setCurrentMonth(prev => (prev + 1) % 12); // Loop or end? User said M1->M12. Let's loop for now or stop.
    };

    const advanceMonth = () => {
        setCurrentMonth(prev => (prev + 1) % 12);
    };

    const importSTC = (jsonData: string) => {
        try {
            const data = JSON.parse(jsonData);
            // Basic validtion
            if (!data.tasks || !data.resources) throw new Error("Invalid STC Data");

            // Restore State
            setTasks(data.tasks.map((t: any) => ({
                ...t,
                dueDate: new Date(t.dueDate),
                createdAt: new Date(t.createdAt),
                lastCompletedAt: t.lastCompletedAt ? new Date(t.lastCompletedAt) : undefined
            })));
            setResources(data.resources);
            setCorruption(data.corruption || 0);
            setOwnedUnits(data.ownedUnits || []);
            setRadarTheme(data.radarTheme || 'green');
            setProjects(data.projects || []);
            setArmyStrength(data.armyStrength || { reserves: { guardsmen: 0, spaceMarines: 0, custodes: 0, dreadnought: 0, baneblade: 0 }, garrisons: {}, totalActivePower: 0 });

            // Phase 7 Restoration
            setCurrentMonth(data.currentMonth !== undefined ? data.currentMonth : new Date().getMonth());
            setSectorHistory(data.sectorHistory || {});

            alert("STC Template Loaded Successfully. Praise the Omnissiah.");
        } catch (error) {
            console.error("STC Import Failed:", error);
            alert("STC Load Failed: Data Corrupted. Heresy Detected.");
        }
    };

    return (
        <GameContext.Provider value={{
            tasks, resources, corruption, ownedUnits, isPenitentMode,
            addTask, updateTask, purgeTask, buyUnit, cleanseCorruption, resetGame,
            radarTheme, purchaseItem,
            viewMode, setViewMode, projects, addProject,
            addSubTask, completeSubTask, deleteProject, recruitUnit,
            deployUnit, recallUnit, // Actions
            armyStrength,
            getTraitForMonth, exportSTC, importSTC,
            currentMonth, sectorHistory, resolveSector, advanceMonth // Phase 7
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
