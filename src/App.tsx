import { useState, useMemo, useEffect } from 'react'
import { ConfigProvider, Input, Typography, theme, Button } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { Plus, ShoppingCart, AlertTriangle, Map as MapIcon, Radar, Mail, Scroll } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarView } from './components/RadarView' // Keep old one just in case, or remove
import { OrbitalRadar } from './components/OrbitalRadar'
import { WeaponDeck } from './components/WeaponDeck'
import { UnitShop } from './components/UnitShop'
import { AddTaskModal } from './components/AddTaskModal'
import { VoxLinkModal } from './components/VoxLinkModal'
import { Armory } from './components/Armory'
import { RequisitionForm } from './components/RequisitionForm'
import { NavigationArray } from './components/NavigationArray'
import { SectorMap } from './components/SectorMap'
import TaskDataSlate from './components/TaskDataSlate' // Added
import { GameProvider, useGame } from './contexts/GameContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './contexts/AuthContext'
import { LineCallback } from './pages/LineCallback'
import { AdminDashboard } from './pages/AdminDashboard'
import { useLocalNotifications } from './hooks/useLocalNotifications'
import './App.css'

const { Title, Text } = Typography;

// Main Content Component separate from Provider to use Context
// Login Screen Component
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
    <div className="scanline" />
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635322966219-b75ed3a90e27?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center" />

    <div className="z-10 border border-imperial-gold/30 bg-black/80 p-12 backdrop-blur-md max-w-md w-full text-center shadow-[0_0_50px_rgba(251,191,36,0.1)]">
      <h1 className="text-imperial-gold text-4xl font-mono mb-2 tracking-widest">帝國邏輯引擎</h1>
      <h2 className="text-zinc-500 text-sm tracking-[0.5em] mb-12">機密存取 // 僅限授權人員</h2>

      <Button
        type="primary"
        size="large"
        onClick={onLogin}
        className="w-full !h-14 !bg-imperial-gold !text-black !font-bold !tracking-widest !text-lg hover:!bg-white transition-all flex items-center justify-center gap-2 mb-4"
      >
        <span className="uppercase">啟動 Google 識別協定</span>
      </Button>

      <Button
        type="default"
        size="large"
        className="w-full !h-14 !border-imperial-gold !text-imperial-gold !font-bold !tracking-widest !text-lg hover:!bg-imperial-gold hover:!text-black transition-all flex items-center justify-center gap-2 !bg-transparent"
        onClick={() => {
          // LINE Login Redirect
          const clientId = '2009004081'; // Should match .env
          const redirectUri = window.location.origin + '/line-callback';
          const state = Math.random().toString(36).substring(7); // Simple state
          const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid`;
          window.location.href = lineAuthUrl;
        }}
      >
        <span className="uppercase">啟動 LINE 連結協定</span>
      </Button>

      <div className="mt-8 text-zinc-600 font-mono text-xs">
        <p>每日箴言：</p>
        <p>「開放的心靈就像一座大門敞開且無人看守的堡壘。」</p>
      </div>
    </div>
  </div>
);

// Authenticated Application Wrapper
const AppContent = () => {
  const { user, loginWithGoogle, logout, getToken } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);

  // Auto-claim legacy data on login
  useEffect(() => {
    if (user) {
      setIsMigrating(true);
      getToken().then(token => {
        // Normalize URL: Remove trailing /api or / if present to default to base
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const baseUrl = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

        fetch(`${baseUrl}/api/migration/claim`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Migration endpoint error');
          })
          .then(data => {
            if (data.message === 'Legacy data claimed successfully') {
              console.log('Legacy data migration:', data);
              // Reload to fetch fresh data
              window.location.reload();
            } else {
              console.log('No legacy data to claim or already claimed.');
            }
          })
          .catch(err => console.error('Migration check failed (This is expected if no legacy data exists):', err))
          .finally(() => setIsMigrating(false));
      });
    }
  }, [user]);

  // Simple routing for callback
  const path = window.location.pathname;
  if (path === '/line-callback') {
    return <LineCallback />;
  }

  if (path === '/admin') {
    return (
      <GameProvider>
        <AdminDashboard />
      </GameProvider>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={loginWithGoogle} />;
  }

  // Only render GameProvider when user is authenticated
  return (
    <GameProvider>
      <MainDashboard currentUser={user} onLogout={logout} />
    </GameProvider>
  );
};

const MainDashboard = ({ currentUser, onLogout }: { currentUser: any, onLogout: () => void }) => {
  const {
    tasks, resources, corruption, ownedUnits, isPenitentMode,
    addTask, updateTask, purgeTask, deleteTask, buyUnit, cleanseCorruption, resetGame, viewMode, allTasks
  } = useGame();

  useLocalNotifications(allTasks);

  // Clock State
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
  const [isVoxLinkOpen, setIsVoxLinkOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
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

  // Exclusive Modal Logic
  const openLedger = () => {
    setIsLedgerOpen(true);
    setIsArmoryOpen(false);
    setIsVoxLinkOpen(false);
    setIsShopOpen(false);
  };

  const openArmory = () => {
    setIsArmoryOpen(true);
    setIsLedgerOpen(false);
    setIsVoxLinkOpen(false);
    setIsShopOpen(false);
  };

  const currentActiveTasks = slateViewMode === 'mandates' ? allTasks : tasks;
  const selectedTask = useMemo(() => currentActiveTasks.find(t => t.id === selectedTaskId), [selectedTaskId, currentActiveTasks]);

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keyword.trim()) {
      setIsAddModalOpen(true);
    }
  };

  if (isPenitentMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-600 font-mono p-8 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-red-950/50 z-0 glitch" />
        <h1 className="!text-red-500 text-8xl tracking-widest z-10 glitch-text font-black scale-150 m-0">滅絕令執行中</h1>
        <h3 className="!text-red-500/80 z-10 mb-12 tracking-[0.5em] uppercase m-0">世界已遭淨化</h3>
        <div className="w-full max-w-2xl border-4 border-red-600 p-8 z-10 bg-black/90 text-center">
          <span className="block text-red-500 mb-4 text-center tracking-[0.3em] font-bold text-2xl">失敗即異端</span>
          <span className="text-red-400 font-mono">系統已因腐壞過高而執行滅絕令。</span>
          <span className="text-red-400 font-mono block mt-2">請重啟系統並重新效忠。</span>
        </div>
        <Button danger size="large" className="mt-12 z-10 border-2 border-red-500 bg-red-900/20 hover:bg-red-500 hover:text-black tracking-widest text-xl h-16 px-12 uppercase font-bold" onClick={resetGame}>
          重新初始化邏輯引擎
        </Button>
      </div>
    );
  }

  const formatDate = (date: Date) => {
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
        <div className="w-full flex justify-between items-start md:w-auto md:flex-col md:items-start">
          <div className="flex flex-col">
            <span className="text-imperial-gold font-mono tracking-[0.2em] text-[10px] md:text-xs opacity-60">帝國曆</span>
            <span className="text-imperial-gold font-bold text-lg md:text-xl tracking-widest font-mono shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              {formatDate(currentTime).split(' ')[0]} <span className="text-xs md:text-lg">{formatDate(currentTime).split(' ')[1]}</span>
            </span>
          </div>
          <div className="flex flex-col items-end md:hidden" onClick={() => setIsShopOpen(true)}>
            <div className="flex items-center gap-2">
              <span className="text-imperial-gold device-font text-xl">{resources.rp} RP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white device-font text-sm">{resources.glory} GLORY</span>
            </div>
          </div>
        </div>

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

        <div className="hidden md:flex gap-8 items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsShopOpen(true)}>
          <div className="text-right relative">
            <span className="block text-imperial-gold/50 text-xs tracking-wider">帝皇之怒 (RP)</span>
            <div className="flex items-center justify-end gap-2">
              <span key={`rp-${resources.rp}`} className="text-imperial-gold device-font text-2xl">{resources.rp}</span>
              <div className="absolute right-0 -top-4 pointer-events-none">
                <span className={`text-xs font-bold text-green-400 font-mono transition-opacity duration-300 ${showRpFeedback ? 'opacity-100 animate-bounce' : 'opacity-0'}`}>+10</span>
              </div>
            </div>
          </div>
          {currentUser && (
            <div className="flex gap-2">
              <Button
                ghost
                className="!border-imperial-gold/50 !text-imperial-gold hover:!bg-imperial-gold/20 font-mono"
                icon={<Mail size={16} />}
                onClick={() => setIsVoxLinkOpen(true)}
              >
                VOX-LINK
              </Button>
              <Button
                ghost
                className="!border-[#c5a059]/50 !text-[#c5a059] hover:!bg-[#c5a059]/20 font-mono"
                icon={<Scroll size={16} />}
                onClick={openLedger}
              >
                LOGISTICS
              </Button>
              <Button
                ghost
                danger
                className="!border-red-900 !text-red-700 hover:!bg-red-900/20 font-mono"
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
              >
                TERMINATE SESSION
              </Button>
            </div>
          )}
          <div className="text-right">
            <span className="block text-white/50 text-xs tracking-wider">榮耀值 (GLORY)</span>
            <span className="text-white device-font text-2xl">{resources.glory}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-row overflow-hidden relative">
        {viewMode === 'tactical' ? (
          <>
            <div className={`fixed inset-y-0 left-0 z-50 w-[85%] bg-black/95 border-r border-imperial-gold/30 transform transition-transform duration-300 md:relative md:transform-none md:w-1/2 md:flex md:flex-col md:bg-black/40 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} h-[100dvh] md:h-auto flex flex-col`}>
              <div className="md:hidden absolute top-4 right-4 z-50">
                <Button type="text" icon={<MapIcon className="text-imperial-gold" />} onClick={() => setIsDrawerOpen(false)} className="!text-imperial-gold border border-imperial-gold/30" />
              </div>

              <div className="flex-1 overflow-y-auto p-6 pb-32 scrollbar-thin scrollbar-thumb-imperial-gold/20 scrollbar-track-transparent">
                <TaskDataSlate
                  tasks={slateViewMode === 'mandates' ? allTasks.filter(t => t.isRecurring) : tasks}
                  selectedId={selectedTaskId}
                  onSelect={setSelectedTaskId}
                  onPurge={purgeTask}
                  onDelete={deleteTask}
                  onOpenAddModal={() => { setEditingTask(null); setIsAddModalOpen(true); setIsDrawerOpen(false); }}
                  viewMode={slateViewMode}
                  onToggleView={setSlateViewMode}
                  onEdit={(task) => { setEditingTask(task); setIsAddModalOpen(true); setIsDrawerOpen(false); }}
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

            {isDrawerOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />}

            <div className="w-full h-full md:w-1/2 relative flex items-center justify-center bg-zinc-900/10">
              <OrbitalRadar tasks={tasks} selectedId={selectedTaskId} onSelectKey={(id) => { setSelectedTaskId(id); setIsDrawerOpen(true); }} />
              <div className="absolute top-4 left-4 z-30 md:hidden">
                <Button onClick={() => setIsDrawerOpen(true)} className="!bg-black/80 !border-imperial-gold/50 !text-imperial-gold !h-12 !w-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <Radar size={24} />
                </Button>
              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {ownedUnits.includes('dreadnought') && <div className="absolute top-[20%] right-[20%] text-imperial-gold/20 animate-pulse font-mono">[無畏機甲 DEPLOYED]</div>}
                {ownedUnits.includes('barge') && <div className="absolute top-[10%] text-imperial-gold/10 text-6xl tracking-[1em] w-full text-center font-mono">/// 軌道支援 ///</div>}
              </div>
            </div>
          </>
        ) : (
          <SectorMap />
        )}

        {/* Tactical FAB - Quick Add Task (Mobile Only) */}
        {!isDrawerOpen && (
          <div className="fixed bottom-24 right-6 z-40 md:hidden">
            <Button
              type="primary"
              shape="circle"
              icon={<Plus size={32} />}
              className="!w-16 !h-16 !bg-imperial-gold !text-black !border-none shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-bounce-slow flex items-center justify-center"
              onClick={() => { setEditingTask(null); setIsAddModalOpen(true); }}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-mono text-imperial-gold bg-black/80 px-2 rounded border border-imperial-gold/30">
                DEPLOY
              </span>
            </div>
          </div>
        )}
      </main>

      <NavigationArray onOpenArmory={openArmory} />

      <UnitShop visible={isShopOpen} onClose={() => setIsShopOpen(false)} glory={resources.glory} onBuy={(unit) => buyUnit(unit.id, unit.cost)} ownedUnitIds={ownedUnits} />

      <AddTaskModal
        visible={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingTask(null); setKeyword(''); }}
        onAdd={(title, faction, diff, date, isRec, dueTime) => {
          if (editingTask) { updateTask(editingTask.id, { title, faction, difficulty: diff, dueDate: date, isRecurring: isRec, dueTime }); }
          else { addTask(title, faction, diff, date, isRec, dueTime); }
        }}
        initialKeyword={keyword}
        initialTask={editingTask}
      />

      <Armory visible={isArmoryOpen} onClose={() => setIsArmoryOpen(false)} />

      <VoxLinkModal visible={isVoxLinkOpen} onClose={() => setIsVoxLinkOpen(false)} />

      <RequisitionForm visible={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} />
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
        <AppContent />
      </ErrorBoundary>
    </ConfigProvider>
  )
}

export default App
