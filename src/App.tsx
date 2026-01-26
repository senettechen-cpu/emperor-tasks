import { useState, useMemo, useEffect } from 'react'
import { ConfigProvider, Input, Typography, theme, Button } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { Plus, ShoppingCart, AlertTriangle, Map as MapIcon, Radar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarView } from './components/RadarView' // Keep old one just in case, or remove
import { OrbitalRadar } from './components/OrbitalRadar'
import { WeaponDeck } from './components/WeaponDeck'
import { UnitShop } from './components/UnitShop'
import { AddTaskModal } from './components/AddTaskModal'
import { Armory } from './components/Armory'
import { NavigationArray } from './components/NavigationArray'
import { SectorMap } from './components/SectorMap'
import TaskDataSlate from './components/TaskDataSlate' // Added
import { GameProvider, useGame } from './contexts/GameContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

const { Title, Text } = Typography;

// Main Content Component separate from Provider to use Context
const MainDashboard = () => {
  const {
    tasks, resources, corruption, ownedUnits, isPenitentMode,
    addTask, updateTask, purgeTask, buyUnit, cleanseCorruption, resetGame, viewMode
  } = useGame();

  // Clock State - Moved to top to prevent conditional hook execution
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [keyword, setKeyword] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Mobile Drawer State
  const [editingTask, setEditingTask] = useState<any>(null); // Task | null
  const [slateViewMode, setSlateViewMode] = useState<'active' | 'mandates'>('active');
  const [showRpFeedback, setShowRpFeedback] = useState(false);

  // RP Feedback Animation Trigger
  useEffect(() => {
    if (resources.rp > 0 && resources.rp % 10 === 0) {
      setShowRpFeedback(true);
      const timer = setTimeout(() => setShowRpFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [resources.rp]);

  const activeTasks = useMemo(() => {
    if (slateViewMode === 'mandates') {
      return tasks.filter(t => t.isRecurring);
    }

    const todayStr = new Date().toLocaleDateString();
    return tasks.filter(t => {
      if (t.status !== 'active') return false;
      if (t.isRecurring) {
        const lastCompStr = t.lastCompletedAt ? new Date(t.lastCompletedAt).toLocaleDateString() : '';
        return lastCompStr !== todayStr;
      }
      return true;
    });
  }, [tasks, slateViewMode]);
  const selectedTask = useMemo(() => activeTasks.find(t => t.id === selectedTaskId), [selectedTaskId, activeTasks]);

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keyword.trim()) {
      setIsAddModalOpen(true);
    }
  };

  if (isPenitentMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-600 font-mono p-8 animate-pulse relative overflow-hidden">
        {/* Background Glitch */}
        <div className="absolute inset-0 bg-red-950/50 z-0 glitch" />

        <h1 className="!text-red-500 text-8xl tracking-widest z-10 glitch-text font-black scale-150 m-0">滅絕令執行中</h1>
        <h3 className="!text-red-500/80 z-10 mb-12 tracking-[0.5em] uppercase m-0">世界已遭淨化</h3>

        <div className="w-full max-w-2xl border-4 border-red-600 p-8 z-10 bg-black/90 text-center">
          <span className="block text-red-500 mb-4 text-center tracking-[0.3em] font-bold text-2xl">失敗即異端</span>
          <span className="text-red-400 font-mono">系統已因腐壞過高而執行滅絕令。</span>
          <span className="text-red-400 font-mono block mt-2">請重啟系統並重新效忠。</span>
        </div>

        <Button
          danger
          size="large"
          className="mt-12 z-10 border-2 border-red-500 bg-red-900/20 hover:bg-red-500 hover:text-black tracking-widest text-xl h-16 px-12 uppercase font-bold"
          onClick={resetGame}
        >
          重新初始化邏輯引擎
        </Button>
      </div>
    );
  }



  const formatDate = (date: Date) => {
    // Format: YYYY/MM/DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className={`h-screen bg-black relative flex flex-col items-center overflow-hidden transition-all duration-300 ${corruption > 95 ? 'glitch-container' : ''}`}>
      <div className="scanline" />

      <header className="w-full flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-b border-imperial-gold/20 z-10 bg-black/80 backdrop-blur-sm gap-4 md:gap-0">

        {/* TopRow for Mobile: Time & Resources */}
        <div className="w-full flex justify-between items-start md:w-auto md:flex-col md:items-start">
          <div className="flex flex-col">
            <span className="text-imperial-gold font-mono tracking-[0.2em] text-[10px] md:text-xs opacity-60">帝國曆</span>
            <span className="text-imperial-gold font-bold text-lg md:text-xl tracking-widest font-mono shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              {formatDate(currentTime).split(' ')[0]} <span className="text-xs md:text-lg">{formatDate(currentTime).split(' ')[1]}</span>
            </span>
          </div>

          {/* Mobile Resource View (Hidden on Desktop) */}
          <div className="flex flex-col items-end md:hidden" onClick={() => setIsShopOpen(true)}>
            <div className="flex items-center gap-2">
              <span className="text-imperial-gold device-font text-xl">{resources.rp} RP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white device-font text-sm">{resources.glory} GLORY</span>
            </div>
          </div>
        </div>

        {/* Corruption Bar (Full width on mobile) */}
        <div
          className="flex flex-col items-center cursor-pointer group w-full md:w-auto"
          onClick={cleanseCorruption}
          title={resources.rp >= 20 ? "啟動淨化協議 (-20 RP / -30 腐壞)" : "資源不足"}
        >
          <h4 className={`!m-0 !tracking-[0.5em] transition-colors duration-300 text-sm md:text-xl font-bold ${corruption > 95 ? '!text-red-500 animate-pulse' : (corruption > 50 ? '!text-green-500' : '!text-mechanicus-red')}`}>
            <span>{corruption > 95 ? '!! 亞空間裂隙 !!' : (corruption > 50 ? '亞空間能量：高' : '偵測亞空間能量')} <span className="font-mono opacity-60 ml-2 text-xs">({Math.floor(corruption)}/100)</span></span>
          </h4>
          <div className="w-full md:w-64 h-2 bg-zinc-900 border border-mechanicus-red/30 mt-2 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${corruption > 80 ? 'bg-red-600' : 'bg-mechanicus-red'}`}
              style={{ width: `${corruption}%` }}
            />
          </div>
        </div>

        {/* Desktop Resource View (Hidden on Mobile) */}
        <div className="hidden md:flex gap-8 items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsShopOpen(true)}>
          <div className="text-right relative">
            <span className="block text-imperial-gold/50 text-xs tracking-wider">帝皇之怒 (RP)</span>
            <div className="flex items-center justify-end gap-2">
              <span key={`rp-${resources.rp}`} className="text-imperial-gold device-font text-2xl">{resources.rp}</span>

              {/* Floating +10 Feedback - Stable DOM Version */}
              <div className="absolute right-0 -top-4 pointer-events-none">
                <span
                  className={`text-xs font-bold text-green-400 font-mono transition-opacity duration-300 ${showRpFeedback ? 'opacity-100 animate-bounce' : 'opacity-0'}`}
                >
                  +10
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-white/50 text-xs tracking-wider">榮耀值 (GLORY)</span>
            <span className="text-white device-font text-2xl">{resources.glory}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-row overflow-hidden relative">
        {viewMode === 'tactical' ? (
          <>
            {/* LEFT PANEL: Task Data & Input (Drawer on Mobile) */}
            <div
              className={`
                    fixed inset-y-0 left-0 z-50 w-[85%] bg-black/95 border-r border-imperial-gold/30 transform transition-transform duration-300 md:relative md:transform-none md:w-1/2 md:flex md:flex-col md:bg-black/40
                    ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
              {/* Mobile Drawer Close Button */}
              <div className="md:hidden absolute top-4 right-4 z-50">
                <Button
                  type="text"
                  icon={<MapIcon className="text-imperial-gold" />}
                  onClick={() => setIsDrawerOpen(false)}
                  className="!text-imperial-gold border border-imperial-gold/30"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-imperial-gold/20 scrollbar-track-transparent">
                <TaskDataSlate
                  tasks={activeTasks}
                  selectedId={selectedTaskId}
                  onSelect={setSelectedTaskId}
                  onPurge={purgeTask}
                  onOpenAddModal={() => {
                    setEditingTask(null);
                    setIsAddModalOpen(true);
                    setIsDrawerOpen(false); // Close drawer on mobile
                  }}
                  viewMode={slateViewMode}
                  onToggleView={setSlateViewMode}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setIsAddModalOpen(true);
                    setIsDrawerOpen(false);
                  }}
                />
              </div>

              <div className="p-6 border-t border-imperial-gold/10 bg-black/60 backdrop-blur-sm">
                <Input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={handleQuickAdd}
                  placeholder="> 輸入任務代碼並按 ENTER 進行部屬..."
                  className="!bg-black/80 !border-imperial-gold/50 !text-imperial-gold font-mono h-12 text-center tracking-wider hover:!border-imperial-gold focus:!border-imperial-gold focus:!shadow-[0_0_15px_#fbbf24]"
                  suffix={<Plus size={16} className="text-imperial-gold/50" />}
                />
              </div>
            </div>

            {/* Mobile Drawer Overlay */}
            {isDrawerOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setIsDrawerOpen(false)}
              />
            )}

            {/* RIGHT PANEL: Radar & Visuals (Visible by default on Mobile now) */}
            <div className="w-full h-full md:w-1/2 relative flex items-center justify-center bg-zinc-900/10">
              <OrbitalRadar
                tasks={activeTasks}
                selectedId={selectedTaskId}
                onSelectKey={(id) => {
                  setSelectedTaskId(id);
                  setIsDrawerOpen(true); // Open drawer to show details when blip clicked
                }}
              />

              {/* Mobile Drawer Toggle Button (Floating) */}
              <div className="absolute top-4 left-4 z-30 md:hidden">
                <Button
                  onClick={() => setIsDrawerOpen(true)}
                  className="!bg-black/80 !border-imperial-gold/50 !text-imperial-gold !h-12 !w-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                >
                  <Radar size={24} />
                </Button>
              </div>

              {/* 已購單位展示 */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {ownedUnits.includes('dreadnought') && (
                  <div className="absolute top-[20%] right-[20%] text-imperial-gold/20 animate-pulse font-mono">
                    [無畏機甲 DEPLOYED]
                  </div>
                )}
                {ownedUnits.includes('barge') && (
                  <div className="absolute top-[10%] text-imperial-gold/10 text-6xl tracking-[1em] w-full text-center font-mono">
                            /// 軌道支援 ///
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* STRATEGIC VIEW */
          <SectorMap />
        )}
      </main>

      {/* Navigation Array (Fixed Bottom) */}
      <NavigationArray onOpenArmory={() => setIsArmoryOpen(true)} />

      {/* Legacy Footer (Hidden for now or integrated differently?) */}
      {/* <footer className="w-full flex justify-center pb-0 z-30">
        <AnimatePresence>
          <motion.div
            className="w-full flex justify-center"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
          >
            <WeaponDeck
              selectedTask={selectedTask}
              onPurge={() => {
                if (selectedTaskId) {
                  purgeTask(selectedTaskId);
                  setSelectedTaskId(null); // Force UI update immediately
                }
              }}
              onTimerStart={() => console.log('Timer Start')}
            />
          </motion.div>
        </AnimatePresence>
      </footer> */}

      <UnitShop
        visible={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        glory={resources.glory}
        onBuy={(unit) => buyUnit(unit.id, unit.cost)}
        ownedUnitIds={ownedUnits}
      />

      <AddTaskModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
          setKeyword('');
        }}
        onAdd={(title, faction, diff, date, isRec) => {
          if (editingTask) {
            updateTask(editingTask.id, { title, faction, difficulty: diff, dueDate: date, isRecurring: isRec });
          } else {
            addTask(title, faction, diff, date, isRec);
          }
        }}
        initialKeyword={keyword}
        initialTask={editingTask}
      />

      <Armory
        visible={isArmoryOpen}
        onClose={() => setIsArmoryOpen(false)}
      />

    </div>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#fbbf24',
          colorBgBase: '#000000',
        },
      }}
    >
      <ErrorBoundary>
        <GameProvider>
          <MainDashboard />
        </GameProvider>
      </ErrorBoundary>
    </ConfigProvider>
  )
}

export default App
