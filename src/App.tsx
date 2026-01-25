import { useState, useMemo } from 'react'
import { ConfigProvider, Input, Typography, theme, Button } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { Plus, ShoppingCart, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarView } from './components/RadarView'
import { WeaponDeck } from './components/WeaponDeck'
import { UnitShop } from './components/UnitShop'
import { AddTaskModal } from './components/AddTaskModal'
import { GameProvider, useGame } from './contexts/GameContext'
import './App.css'

const { Title, Text } = Typography;

// Main Content Component separate from Provider to use Context
const MainDashboard = () => {
  const {
    tasks, resources, corruption, ownedUnits, isPenitentMode,
    addTask, purgeTask, buyUnit, cheatCorruption, resetGame
  } = useGame();

  const [keyword, setKeyword] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeTasks = useMemo(() => tasks.filter(t => t.status === 'active'), [tasks]);
  const selectedTask = useMemo(() => activeTasks.find(t => t.id === selectedTaskId), [selectedTaskId, activeTasks]);

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keyword.trim()) {
      setIsAddModalOpen(true);
    }
  };

  if (isPenitentMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-mechanicus-red font-mono p-8 animate-shake">
        <div className="fixed inset-0 bg-red-900/20 z-0 animate-pulse" />
        <Title level={1} className="!text-red-500 text-6xl tracking-widest z-10 glitch-text">泰拉失守</Title>
        <Title level={3} className="!text-red-500/80 z-10 mb-12">FALL OF TERRA // SYSTEM FAILURE</Title>

        <div className="w-full max-w-2xl border-2 border-red-600 p-8 z-10 bg-black">
          <Text className="block text-red-500 mb-4 text-center tracking-[0.3em] font-bold">過期任務清單 (OVERDUE MANIFEST)</Text>
          <ul className="list-disc pl-8 space-y-2 text-red-400">
            {activeTasks.map(t => (
              <li key={t.id} className="uppercase flex justify-between">
                <span>{t.title}</span>
                <span className="text-red-600 font-bold">{t.faction}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          danger
          size="large"
          className="mt-12 z-10 border-2 border-red-500 bg-red-900/20 hover:bg-red-500 hover:text-black tracking-widest text-xl h-16 px-12"
          onClick={resetGame}
        >
          發動贖罪遠征 (重啟系統)
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black relative flex flex-col items-center overflow-hidden transition-all duration-300 ${corruption > 80 ? 'animate-glitch' : ''}`}>
      <div className="scanline" />

      <header className="w-full flex justify-between items-center p-6 border-b border-imperial-gold/20 z-10 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col">
          <Text className="text-imperial-gold font-mono tracking-[0.2em] text-xs opacity-60">IMPERIAL DATE</Text>
          <Text className="text-imperial-gold font-bold text-xl tracking-widest font-mono">0 126 024.M3</Text>
        </div>

        <div className="flex flex-col items-center cursor-pointer" onClick={cheatCorruption} title="Click to Simulate Corruption (+10%)">
          <Title level={4} className="!text-mechanicus-red !m-0 !tracking-[0.5em] animate-pulse">
            {corruption > 50 ? '!! 亞空間震盪 DETECTED !!' : 'CORRUPTION LEVEL'}
          </Title>
          <div className="w-64 h-2 bg-zinc-900 border border-mechanicus-red/30 mt-2 relative overflow-hidden">
            <div
              className="h-full bg-mechanicus-red transition-all duration-1000"
              style={{ width: `${corruption}%` }}
            />
          </div>
        </div>

        <div className="flex gap-8 items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsShopOpen(true)}>
          <div className="text-right">
            <Text className="block text-imperial-gold/50 text-xs tracking-wider">帝皇之怒 (RP)</Text>
            <Text className="text-imperial-gold device-font text-2xl">{resources.rp}</Text>
          </div>
          <div className="text-right">
            <Text className="block text-white/50 text-xs tracking-wider">榮耀值 (GLORY)</Text>
            <Text className="text-white device-font text-2xl">{resources.glory}</Text>
          </div>
          <ShoppingCart className="text-imperial-gold" />
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center relative">
        <RadarView
          tasks={activeTasks}
          selectedId={selectedTaskId}
          onSelectKey={setSelectedTaskId}
        />

        {/* 已購單位展示 (漂浮於雷達周圍) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {ownedUnits.includes('dreadnought') && (
            <div className="absolute top-[20%] right-[20%] text-imperial-gold/20 animate-pulse font-mono">
              [無畏機甲 DEPLOYED]
            </div>
          )}
          {ownedUnits.includes('barge') && (
            <div className="absolute top-[10%] text-imperial-gold/10 text-6xl tracking-[1em] w-full text-center font-mono">
                /// ORBITAL SUPPORT ///
            </div>
          )}
        </div>

        <div className="absolute bottom-12 w-full max-w-lg z-20">
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleQuickAdd}
            placeholder="> 輸入任務代碼並按 ENTER 進行部屬..."
            className="!bg-black/80 !border-imperial-gold/50 !text-imperial-gold font-mono h-12 text-center tracking-wider hover:!border-imperial-gold focus:!border-imperial-gold focus:!shadow-[0_0_15px_#fbbf24]"
            suffix={<Plus size={16} className="text-imperial-gold/50" />}
          />
        </div>
      </main>

      <footer className="w-full flex justify-center pb-0 z-30">
        <AnimatePresence>
          <motion.div
            className="w-full flex justify-center"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
          >
            <WeaponDeck
              selectedTask={selectedTask}
              onPurge={() => selectedTaskId && purgeTask(selectedTaskId)}
              onTimerStart={() => console.log('Timer Start')}
            />
          </motion.div>
        </AnimatePresence>
      </footer>

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
          setKeyword('');
        }}
        onAdd={addTask}
        initialKeyword={keyword}
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
      <GameProvider>
        <MainDashboard />
      </GameProvider>
    </ConfigProvider>
  )
}

export default App
