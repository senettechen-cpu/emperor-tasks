export type Faction = 'nurgle' | 'khorne' | 'tzeentch' | 'slaanesh' | 'orks' | 'necrons' | 'default';

export interface Task {
    id: string;
    title: string;
    faction: Faction;
    difficulty: number; // 1-5
    dueDate: Date;
    createdAt: Date;
    status: 'active' | 'completed' | 'failed';
    isRecurring?: boolean; // 每日固定任務
    lastCompletedAt?: Date; // 上次完成日期
    streak?: number; // 連續達成次數
    dueTime?: string; // 每日截止時間 "HH:mm"
}

export interface Resources {
    rp: number; // 帝皇之怒
    glory: number; // 榮耀值
}

export interface Unit {
    id: string;
    name: string;
    cost: number;
    description: string;
    icon?: React.ReactNode;
}

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Project {
    id: string;
    title: string;
    month: string; // e.g., "M31.005"
    difficulty: number;
    subTasks: SubTask[];
    completed: boolean;
}

export type UnitType = 'guardsmen' | 'space_marine' | 'custodes' | 'dreadnought' | 'baneblade';

export interface ArmyStrength {
    reserves: Record<UnitType, number>;
    garrisons: Record<string, Record<UnitType, number>>; // e.g. "M1": { guardsmen: 10, ... }
    totalActivePower: number; // Sum of all garrisons' power (Effective Defense)
}

export type PlanetaryTraitType = 'hive' | 'forge' | 'death' | 'shrine' | 'barren';

export interface SectorTrait {
    month: string;
    type: PlanetaryTraitType;
}

export type BattleResult = 'victory' | 'defeat';


export type SectorHistory = Record<string, BattleResult>; // e.g. "M1": "victory"

export interface GameState {
    id: string;
    resources: Resources;
    corruption: number;
    currentMonth: number;
    isPenitentMode: boolean;
    armyStrength: ArmyStrength;
    sectorHistory: SectorHistory;
    ownedUnits: string[];
    notificationEmail?: string;
    emailEnabled?: boolean;
}
