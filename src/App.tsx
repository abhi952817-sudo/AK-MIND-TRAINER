import React, { useState } from 'react';
import { COLORS, ScreenId, StateMode, ThemeMode, User } from './types/ludoverse';
import { DesignInspectorToolbar } from './components/ludoverse/DesignInspectorToolbar';
import { SplashScreen } from './components/ludoverse/SplashScreen';
import { LoginScreen } from './components/ludoverse/LoginScreen';
import { SignupScreen } from './components/ludoverse/SignupScreen';
import { ForgotPasswordScreen } from './components/ludoverse/ForgotPasswordScreen';
import { HomeScreen } from './components/ludoverse/HomeScreen';
import { ProfileScreen } from './components/ludoverse/ProfileScreen';
import { LobbyScreen } from './components/ludoverse/LobbyScreen';
import { RoomWaitingScreen } from './components/ludoverse/RoomWaitingScreen';
import { ChatOverlay } from './components/ludoverse/ChatOverlay';
import { GameScreen } from './components/ludoverse/GameScreen';
import { WinnerScreen } from './components/ludoverse/WinnerScreen';
import { RulesScreen } from './components/ludoverse/RulesScreen';
import { SpinScreen } from './components/ludoverse/SpinScreen';
import { SnakesLaddersScreen } from './components/ludoverse/SnakesLaddersScreen';
import { AdBanner } from './components/ludoverse/ads/AdBanner';
import { RewardedAdModal } from './components/ludoverse/ads/RewardedAdModal';
import { InterstitialAdModal } from './components/ludoverse/ads/InterstitialAdModal';
import { SoundSettingsModal } from './components/ludoverse/SoundSettingsModal';
import { toast } from './components/ludoverse/UIComponents';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('splash');
  const [state, setState] = useState<StateMode>('data');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [initialBoardType, setInitialBoardType] = useState<'classic' | 'octagon'>('classic');
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);

  // Coins state — starts as null (no fake data)
  const [coins, setCoins] = useState<number | null>(null);

  // Ad state
  const [rewardedOpen, setRewardedOpen] = useState(false);
  const [interstitialOpen, setInterstitialOpen] = useState(false);

  const showBanner = screen === 'home' || screen === 'profile' || screen === 'lobby';

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onDone={(hasUser) => setScreen(hasUser ? 'home' : 'login')} />;
      case 'login':
        return <LoginScreen onLogin={() => setScreen('home')} onSignup={() => setScreen('signup')} onForgot={() => setScreen('forgot')} />;
      case 'signup':
        return <SignupScreen onBack={() => setScreen('login')} onSignup={() => setScreen('home')} onTerms={() => setScreen('rules')} />;
      case 'forgot':
        return <ForgotPasswordScreen onBack={() => setScreen('login')} />;
      case 'home':
        return (
          <HomeScreen
            user={user}
            state={state}
            coins={coins}
            onOpenLudo={() => {
              setInitialBoardType('classic');
              setScreen('lobby');
            }}
            onSelectGame={(gId) => {
              if (gId === 'ludo') {
                setInitialBoardType('classic');
                setScreen('game');
              } else if (gId === 'ludo8') {
                setInitialBoardType('octagon');
                setScreen('game');
              } else if (gId === 'snakes_ladders') {
                setScreen('snakes');
              } else if (gId === 'spin') {
                setScreen('spin');
              }
            }}
            onOpenSnakes={() => setScreen('snakes')}
            onOpenSpin={() => setScreen('spin')}
            onOpenProfile={() => setScreen('profile')}
            onOpenCoins={() => setRewardedOpen(true)}
            onOpenSettings={() => setSoundSettingsOpen(true)}
          />
        );
      case 'profile':
        return <ProfileScreen user={user} state={state} onBack={() => setScreen('home')} />;
      case 'lobby':
        return <LobbyScreen state={state} onBack={() => setScreen('home')} onEnterRoom={(c) => { setRoomCode(c); setScreen('room'); }} />;
      case 'room':
        return <RoomWaitingScreen code={roomCode || 'ABCD'} onLeave={() => setScreen('lobby')} onStart={() => setScreen('game')} onChat={() => setChatOpen(true)} />;
      case 'game':
        return (
          <GameScreen
            state={state}
            initialBoardType={initialBoardType}
            onQuit={() => setScreen('home')}
            onWinner={() => setScreen('winner')}
            onChat={() => setChatOpen(true)}
            onRules={() => setScreen('rules')}
            onOpenSettings={() => setSoundSettingsOpen(true)}
          />
        );
      case 'winner':
        return <WinnerScreen onPlayAgain={() => setScreen('room')} onBackLobby={() => setScreen('lobby')} />;
      case 'rules':
        return <RulesScreen onClose={() => setScreen('home')} />;
      case 'spin':
        return (
          <SpinScreen
            state={state}
            coins={coins}
            onCoinsEarned={(n) => setCoins((c) => (c ?? 0) + n)}
            onBack={() => setScreen('home')}
            onShowInterstitial={() => setInterstitialOpen(true)}
          />
        );
      case 'snakes':
        return (
          <SnakesLaddersScreen
            state={state}
            onQuit={() => setScreen('home')}
            onWinner={() => { toast('Winner!', 'success'); setScreen('home'); }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full relative flex flex-col"
      style={{ background: theme === 'dark' ? COLORS.bgDark : COLORS.bgLight, color: theme === 'dark' ? '#fff' : COLORS.bgDark }}
    >
      <DesignInspectorToolbar
        screen={screen}
        setScreen={setScreen}
        state={state}
        setState={setState}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="pt-12 flex-1 overflow-hidden relative">
        {renderScreen()}
      </div>

      {showBanner && <AdBanner />}

      <ChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} />

      <RewardedAdModal
        open={rewardedOpen}
        rewardCoins={1}
        onClose={() => setRewardedOpen(false)}
        onReward={(n) => setCoins((c) => (c ?? 0) + n)}
      />

      <InterstitialAdModal
        open={interstitialOpen}
        duration={5}
        onClose={() => setInterstitialOpen(false)}
      />

      <SoundSettingsModal
        open={soundSettingsOpen}
        onClose={() => setSoundSettingsOpen(false)}
      />
    </div>
  );
}
