import React from 'react';
import { COLORS, StateMode, ScreenStateMode, User, UserProfile } from '../../types/ludoverse';
import { Avatar, Skeleton, CoinBadge, toast } from './UIComponents';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

const GAMES = [
  { id: 'ludo', name: 'Ludo Classic (4P)', icon: '🎲', color: '#E85A0C', active: true },
  { id: 'ludojodi', name: 'Jodi 2v2 (Team Mode)', icon: '🤝', color: '#2563EB', active: true },
  { id: 'ludo6', name: 'Hexagon Ludo (6P)', icon: '⬡', color: '#10B981', active: true },
  { id: 'ludo8', name: 'Octagon Ludo (8P)', icon: '🔷', color: '#0055D4', active: true },
  { id: 'ludo10', name: 'Decagon Ludo (10P)', icon: '⭐', color: '#7C3AED', active: true },
  { id: 'snake', name: 'Snakes & Ladders', icon: '🐍', color: COLORS.green, active: true },
  { id: 'spin', name: 'Lucky Spin', icon: '🎡', color: COLORS.yellow, active: true },
];

export const HomeScreen: React.FC<{
  user: User | UserProfile | null;
  state?: StateMode | ScreenStateMode;
  stateMode?: StateMode | ScreenStateMode;
  coins?: number | null;
  onOpenLudo?: () => void;
  onOpenSnakes?: () => void;
  onOpenSpin?: () => void;
  onOpenProfile?: () => void;
  onOpenCoins?: () => void;
  onSelectGame?: (gameId: string) => void;
  onOpenSettings?: () => void;
  currentTab?: 'home' | 'play' | 'profile';
  onChangeTab?: (tab: 'home' | 'play' | 'profile') => void;
}> = ({
  user,
  state,
  stateMode,
  coins = 500,
  onOpenLudo,
  onOpenSnakes,
  onOpenSpin,
  onOpenProfile = () => {},
  onOpenCoins = () => {},
  onSelectGame,
  onOpenSettings,
  currentTab = 'home',
  onChangeTab,
}) => {
  const currentState = String(state || stateMode || 'data').toLowerCase();
  const greeting = user?.name ? `Hi, ${user.name}` : 'Hi';

  const handleLudo = () => {
    if (onOpenLudo) onOpenLudo();
    else if (onSelectGame) onSelectGame('ludo');
  };

  const handleSnakes = () => {
    if (onOpenSnakes) onOpenSnakes();
    else if (onSelectGame) onSelectGame('snakes_ladders');
  };

  const handleSpin = () => {
    if (onOpenSpin) onOpenSpin();
    else if (onSelectGame) onSelectGame('spin');
  };

  const handleGame = (id: string) => {
    if (id === 'ludo') return handleLudo();
    if (id === 'ludojodi' || id === 'ludo6' || id === 'ludo8' || id === 'ludo10') {
      if (onSelectGame) onSelectGame(id);
      else handleLudo();
      return;
    }
    if (id === 'snake') return handleSnakes();
    if (id === 'spin') return handleSpin();
    toast('Coming soon');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: COLORS.bgDark }}>
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <button onClick={onOpenProfile}><Avatar size={40} name={user?.name} photoUrl={user?.photoUrl} /></button>
        <span className="font-semibold text-lg text-white">AK MIND TRAINER</span>
        <div className="flex items-center gap-2">
          <button onClick={onOpenCoins}><CoinBadge coins={coins} /></button>
          <button onClick={onOpenSettings || onOpenProfile} className="text-xl">⚙️</button>
        </div>
      </div>

      <div className="px-4 mt-2 mb-4 shrink-0 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-2xl text-white">{greeting}</h2>
          <p className="text-sm mt-0.5" style={{ color: COLORS.textSecondary }}>Ready to play?</p>
        </div>
        <PWAInstallButton variant="compact" />
      </div>

      <div className="px-4 grid grid-cols-2 gap-4 flex-1 overflow-y-auto pb-6 no-scrollbar">
        {currentState === 'loading'
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h="160px" radius={20} />)
          : GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGame(g.id)}
                className="aspect-square rounded-[20px] flex flex-col items-center justify-center gap-2 relative overflow-hidden active:scale-[0.97] transition-transform text-white cursor-pointer"
                style={{
                  background: g.active ? `linear-gradient(145deg, ${g.color}, ${g.color}aa)` : '#2a2a3e',
                  opacity: g.active ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: 48 }}>{g.icon}</span>
                <span className="font-semibold text-sm text-center px-2">{g.name}</span>
                {!g.active && (
                  <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full" style={{ background: '#0008' }}>🔒</span>
                )}
              </button>
            ))}
      </div>

      <div className="h-16 border-t flex items-center justify-around shrink-0" style={{ background: COLORS.surfaceDark, borderColor: '#8D99AE22' }}>
        <NavItem
          icon="🏠"
          label="Home"
          active={currentTab === 'home'}
          onClick={() => onChangeTab?.('home')}
        />
        <NavItem
          icon="🎮"
          label="Play"
          active={currentTab === 'play'}
          onClick={() => {
            onChangeTab?.('play');
            handleLudo();
          }}
        />
        <NavItem
          icon="👤"
          label="Profile"
          active={currentTab === 'profile'}
          onClick={() => {
            onChangeTab?.('profile');
            onOpenProfile();
          }}
        />
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1" style={{ color: active ? COLORS.red : COLORS.textSecondary }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default HomeScreen;
