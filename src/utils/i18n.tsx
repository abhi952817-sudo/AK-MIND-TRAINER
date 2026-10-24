// src/utils/i18n.tsx
// Internationalization (i18n) engine supporting English, Hindi (हिन्दी), Spanish (Español), and French (Français).
// Provides reactive context, hooks, persistence via localStorage, and zero external runtime dependencies.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'es' | 'fr';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export const PRIMARY_LANG_STORAGE_KEY = 'ak_app_language';

export const TRANSLATIONS = {
  en: {
    // General & Navigation
    appName: 'AK Mind Trainer',
    home: 'Home',
    play: 'Play',
    settings: 'Settings',
    audioSettings: 'Audio & Sound Settings',
    languageSettings: 'Language Settings',
    selectLanguage: 'Select Language',
    sound: 'Sound',
    rules: 'Rules',
    rulesGuide: 'Rules & Path Guide',
    profile: 'Profile',
    chat: 'Chat',
    quit: 'Quit Game',
    quitConfirmTitle: 'Quit Match?',
    quitConfirmMsg: 'Are you sure you want to exit the current match?',
    cancel: 'Cancel',
    confirm: 'Confirm',
    restartMatch: 'Restart Match',
    passAndPlay: 'Pass & Play',
    on: 'ON',
    off: 'OFF',
    readyToPlay: 'Ready to Play!',
    readyToPlayQuestion: 'Ready to play?',
    back: 'Back',
    setup: 'Setup',
    comingSoon: 'Coming soon',

    // Game Modes
    classic4P: 'Classic 4P',
    jodi2v2: 'Jodi 2v2',
    pentagon5P: 'Pentagon 5P',
    hexagon6P: 'Hexagon 6P',
    octagon8P: 'Octagon 8P',
    enneagon9P: 'Enneagon 9P',
    decagon10P: 'Decagon 10P',
    duel2P: '2P Duel',
    ffa: 'Free-For-All',
    teamPartnership: 'Team Partnership',
    customLobby: 'Custom Lobby',
    matchSetupSeats: 'Match Setup & Seats',
    snakesAndLadders: 'Snakes & Ladders',
    luckySpin: 'Lucky Spin',

    // Turn & In-Game Banner
    yourTurn: 'Your Turn',
    rollTheDice: 'Roll the Dice',
    tapGlowingToken: 'Tap glowing token (path trail shown!)',
    rolling: 'Rolling…',
    botThinking: 'thinking…',
    winsTheMatch: 'Wins the Match!',
    matchFinished: 'Match Finished!',
    partnerAssist: 'Partner Assist: Rolling to move partner\'s token!',
    teamAlpha: 'Team Alpha',
    teamBeta: 'Team Beta',

    // Settings Modal
    settingsTitle: 'Settings & Audio Engine',
    volumeControls: 'Volume & Audio Controls',
    masterVolume: 'Master Volume',
    sfxVolume: 'Sound Effects (SFX)',
    bgmVolume: 'Background Music (BGM)',
    ambientVolume: 'Ambient Atmosphere',
    hapticsVibration: 'Haptics & Vibration',
    activeHapticFeedback: 'Active physical feedback on roll and captures',
    soundboard23: '23-Event Audio Soundboard',
    allSounds: 'All (23)',
    diceSounds: 'Dice (4)',
    tokenSounds: 'Tokens (7)',
    gameSounds: 'Game (7)',
    uiSounds: 'UI (5)',
    resetDefaults: 'Reset Defaults',
    mute: 'Mute',
    unmute: 'Unmute',

    // Lobby & Room
    lobby: 'Lobby',
    joinRoom: 'Join Room',
    createRoom: 'Create Room',
    roomCode: 'Room Code',
    enterCode: 'Enter 4-digit code',
    playersCount: 'Players',
    privateRoom: 'Private Room',
    publicRoom: 'Public Room',
    startGame: 'Start Game',

    // Victory Screen
    matchComplete: 'Match Complete',
    winner: 'Winner',
    winnerExclamation: 'Winner!',
    playAgain: 'Play Again',
    backToLobby: 'Back to Lobby',
    shareVictory: 'Share Victory',
    victoryShared: 'Victory shared to clipboard!',
    moves: 'Moves',
    totalTime: 'Total Time',
    captured: 'Captured',
  },

  hi: {
    // General & Navigation
    appName: 'एके माइंड ट्रेनर',
    home: 'होम',
    play: 'खेलें',
    settings: 'सेटिंग्स',
    audioSettings: 'ऑडियो और ध्वनि सेटिंग्स',
    languageSettings: 'भाषा सेटिंग्स (Language)',
    selectLanguage: 'भाषा चुनें',
    sound: 'आवाज़',
    rules: 'नियम',
    rulesGuide: 'नियम और पाथ गाइड',
    profile: 'प्रोफ़ाइल',
    chat: 'चैट',
    quit: 'खेल छोड़ें',
    quitConfirmTitle: 'मैच छोड़ना चाहते हैं?',
    quitConfirmMsg: 'क्या आप वाकई इस वर्तमान मैच से बाहर निकलना चाहते हैं?',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    restartMatch: 'मैच रीस्टार्ट करें',
    passAndPlay: 'पास एंड प्ले',
    on: 'चालू',
    off: 'बंद',
    readyToPlay: 'खेलने के लिए तैयार!',
    readyToPlayQuestion: 'खेलने के लिए तैयार हैं?',
    back: 'पीछे',
    setup: 'सेटअप',
    comingSoon: 'जल्द आ रहा है',

    // Game Modes
    classic4P: 'क्लासिक 4P',
    jodi2v2: 'जोड़ी 2v2',
    pentagon5P: 'पेंटागन 5P',
    hexagon6P: 'हेक्सागन 6P',
    octagon8P: 'ऑक्टागन 8P',
    enneagon9P: 'एनेगन 9P',
    decagon10P: 'डेकागन 10P',
    duel2P: '2P द्वंद्व (Duel)',
    ffa: 'सभी के खिलाफ (FFA)',
    teamPartnership: 'टीम साझेदारी',
    customLobby: 'कस्टम लॉबी',
    matchSetupSeats: 'मैच सेटअप और सीटें',
    snakesAndLadders: 'सांप-सीढ़ी',
    luckySpin: 'लकी स्पिन',

    // Turn & In-Game Banner
    yourTurn: 'आपकी बारी',
    rollTheDice: 'पासा फेंकें (Roll Dice)',
    tapGlowingToken: 'चमकती गोटी पर टैप करें (रास्ता देखें)',
    rolling: 'पासा घूम रहा है…',
    botThinking: 'सोच रहा है…',
    winsTheMatch: 'मैच जीत लिया!',
    matchFinished: 'मैच समाप्त!',
    partnerAssist: 'पार्टनर सहायता: साथी की गोटी चलाने के लिए पासा रोल!',
    teamAlpha: 'टीम अल्फा',
    teamBeta: 'टीम बीटा',

    // Settings Modal
    settingsTitle: 'सेटिंग्स और ऑडियो इंजन',
    volumeControls: 'वॉल्यूम और ऑडियो नियंत्रण',
    masterVolume: 'मास्टर वॉल्यूम',
    sfxVolume: 'ध्वनि प्रभाव (SFX)',
    bgmVolume: 'बैकग्राउंड संगीत (BGM)',
    ambientVolume: 'परिवेश का माहौल (Ambient)',
    hapticsVibration: 'हैप्टिक्स और कंपन',
    activeHapticFeedback: 'पासा फेंकने व गोटी कटने पर स्पर्श कंपन',
    soundboard23: '23-इवेंट ऑडियो साउंडबोर्ड',
    allSounds: 'सभी (23)',
    diceSounds: 'पासा (4)',
    tokenSounds: 'गोटियां (7)',
    gameSounds: 'गेम (7)',
    uiSounds: 'यूआई (5)',
    resetDefaults: 'डिफ़ॉल्ट रीसेट करें',
    mute: 'म्यूट',
    unmute: 'अनम्यूट',

    // Lobby & Room
    lobby: 'लॉबी',
    joinRoom: 'रूम में शामिल हों',
    createRoom: 'रूम बनाएं',
    roomCode: 'रूम कोड',
    enterCode: '4 अंकों का कोड दर्ज करें',
    playersCount: 'खिलाड़ी',
    privateRoom: 'प्राइवेट रूम',
    publicRoom: 'पब्लिक रूम',
    startGame: 'खेल शुरू करें',

    // Victory Screen
    matchComplete: 'मैच पूरा हुआ',
    winner: 'विजेता',
    winnerExclamation: 'विजेता!',
    playAgain: 'फिर से खेलें',
    backToLobby: 'लॉबी पर वापस',
    shareVictory: 'जीत साझा करें',
    victoryShared: 'जीत क्लिपबोर्ड पर साझा की गई!',
    moves: 'कुल चालें',
    totalTime: 'कुल समय',
    captured: 'काटी गई गोटियां',
  },

  es: {
    // General & Navigation
    appName: 'AK Mind Trainer',
    home: 'Inicio',
    play: 'Jugar',
    settings: 'Ajustes',
    audioSettings: 'Ajustes de Sonido y Audio',
    languageSettings: 'Ajustes de Idioma',
    selectLanguage: 'Seleccionar Idioma',
    sound: 'Sonido',
    rules: 'Reglas',
    rulesGuide: 'Reglas y Guía de Rutas',
    profile: 'Perfil',
    chat: 'Chat',
    quit: 'Salir del Juego',
    quitConfirmTitle: '¿Salir de la partida?',
    quitConfirmMsg: '¿Estás seguro de que deseas salir de la partida actual?',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    restartMatch: 'Reiniciar Partida',
    passAndPlay: 'Pasa y Juega',
    on: 'ACTIVADO',
    off: 'DESACTIVADO',
    readyToPlay: '¡Listo para jugar!',
    readyToPlayQuestion: '¿Listo para jugar?',
    back: 'Atrás',
    setup: 'Ajustes',
    comingSoon: 'Próximamente',

    // Game Modes
    classic4P: 'Clásico 4J',
    jodi2v2: 'Parejas 2v2',
    pentagon5P: 'Pentágono 5J',
    hexagon6P: 'Hexágono 6J',
    octagon8P: 'Octágono 8J',
    enneagon9P: 'Eneágono 9J',
    decagon10P: 'Decágono 10J',
    duel2P: 'Duelo 2J',
    ffa: 'Todos contra Todos',
    teamPartnership: 'Alianza por Equipos',
    customLobby: 'Sala Personalizada',
    matchSetupSeats: 'Configuración y Asientos',
    snakesAndLadders: 'Serpientes y Escaleras',
    luckySpin: 'Giro de la Suerte',

    // Turn & In-Game Banner
    yourTurn: 'Tu Turno',
    rollTheDice: 'Lanza el Dado',
    tapGlowingToken: 'Toca la ficha brillante (muestra camino)',
    rolling: 'Tirando…',
    botThinking: 'pensando…',
    winsTheMatch: '¡Gana la Partida!',
    matchFinished: '¡Partida Terminada!',
    partnerAssist: 'Asistencia: ¡Tirando para mover la ficha de tu compañero!',
    teamAlpha: 'Equipo Alfa',
    teamBeta: 'Equipo Beta',

    // Settings Modal
    settingsTitle: 'Ajustes y Motor de Audio',
    volumeControls: 'Control de Volumen y Sonido',
    masterVolume: 'Volumen General',
    sfxVolume: 'Efectos de Sonido (SFX)',
    bgmVolume: 'Música de Fondo (BGM)',
    ambientVolume: 'Atmósfera Ambiental',
    hapticsVibration: 'Vibración y Háptica',
    activeHapticFeedback: 'Respuesta física al rodar dado y capturas',
    soundboard23: 'Botonera de Audio (23 Eventos)',
    allSounds: 'Todos (23)',
    diceSounds: 'Dado (4)',
    tokenSounds: 'Fichas (7)',
    gameSounds: 'Juego (7)',
    uiSounds: 'IU (5)',
    resetDefaults: 'Restablecer Valores',
    mute: 'Silenciar',
    unmute: 'Activar sonido',

    // Lobby & Room
    lobby: 'Sala de Espera',
    joinRoom: 'Unirse a Sala',
    createRoom: 'Crear Sala',
    roomCode: 'Código de Sala',
    enterCode: 'Código de 4 dígitos',
    playersCount: 'Jugadores',
    privateRoom: 'Sala Privada',
    publicRoom: 'Sala Pública',
    startGame: 'Iniciar Partida',

    // Victory Screen
    matchComplete: 'Partida Completada',
    winner: 'Ganador',
    winnerExclamation: '¡Ganador!',
    playAgain: 'Jugar de Nuevo',
    backToLobby: 'Volver a Sala',
    shareVictory: 'Compartir Victoria',
    victoryShared: '¡Victoria compartida en el portapapeles!',
    moves: 'Movimientos',
    totalTime: 'Tiempo Total',
    captured: 'Capturadas',
  },

  fr: {
    // General & Navigation
    appName: 'AK Mind Trainer',
    home: 'Accueil',
    play: 'Jouer',
    settings: 'Paramètres',
    audioSettings: 'Paramètres Audio et Sonore',
    languageSettings: 'Paramètres de Langue',
    selectLanguage: 'Choisir la Langue',
    sound: 'Son',
    rules: 'Règles',
    rulesGuide: 'Règles et Guide de Parcours',
    profile: 'Profil',
    chat: 'Discussion',
    quit: 'Quitter la Partie',
    quitConfirmTitle: 'Quitter la partie ?',
    quitConfirmMsg: 'Êtes-vous sûr de vouloir quitter la partie en cours ?',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    restartMatch: 'Recommencer la Partie',
    passAndPlay: 'Passe et Joue',
    on: 'ACTIVÉ',
    off: 'DÉSACTIVÉ',
    readyToPlay: 'Prêt à Jouer !',
    readyToPlayQuestion: 'Prêt à jouer ?',
    back: 'Retour',
    setup: 'Configuration',
    comingSoon: 'Bientôt disponible',

    // Game Modes
    classic4P: 'Classique 4J',
    jodi2v2: 'Duo 2v2',
    pentagon5P: 'Pentagone 5J',
    hexagon6P: 'Hexagone 6J',
    octagon8P: 'Octogone 8J',
    enneagon9P: 'Ennéagone 9J',
    decagon10P: 'Décagone 10J',
    duel2P: 'Duel 2J',
    ffa: 'Chacun pour soi',
    teamPartnership: 'Partenariat d\'Équipe',
    customLobby: 'Salon Personnalisé',
    matchSetupSeats: 'Configuration & Sièges',
    snakesAndLadders: 'Serpents et Échelles',
    luckySpin: 'Roue de la Fortune',

    // Turn & In-Game Banner
    yourTurn: 'À Votre Tour',
    rollTheDice: 'Lancez le Dé',
    tapGlowingToken: 'Touchez le pion brillant (trajet affiché)',
    rolling: 'Lancement…',
    botThinking: 'réfléchit…',
    winsTheMatch: 'Remporte la Partie !',
    matchFinished: 'Partie Terminée !',
    partnerAssist: 'Assistance : Vous lancez pour déplacer le pion partenaire !',
    teamAlpha: 'Équipe Alpha',
    teamBeta: 'Équipe Bêta',

    // Settings Modal
    settingsTitle: 'Paramètres & Moteur Audio',
    volumeControls: 'Contrôles du Volume et Son',
    masterVolume: 'Volume Général',
    sfxVolume: 'Effets Sonores (SFX)',
    bgmVolume: 'Musique de Fond (BGM)',
    ambientVolume: 'Atmosphère Ambiante',
    hapticsVibration: 'Vibrations & Haptique',
    activeHapticFeedback: 'Retour haptique physique sur dé et captures',
    soundboard23: 'Table Sonore (23 Événements)',
    allSounds: 'Tous (23)',
    diceSounds: 'Dés (4)',
    tokenSounds: 'Pions (7)',
    gameSounds: 'Jeu (7)',
    uiSounds: 'Interface (5)',
    resetDefaults: 'Réinitialiser',
    mute: 'Muet',
    unmute: 'Activer le son',

    // Lobby & Room
    lobby: 'Salon',
    joinRoom: 'Rejoindre un Salon',
    createRoom: 'Créer un Salon',
    roomCode: 'Code du Salon',
    enterCode: 'Code à 4 chiffres',
    playersCount: 'Joueurs',
    privateRoom: 'Salon Privé',
    publicRoom: 'Salon Public',
    startGame: 'Démarrer le Jeu',

    // Victory Screen
    matchComplete: 'Partie Terminée',
    winner: 'Gagnant',
    winnerExclamation: 'Gagnant !',
    playAgain: 'Rejouer',
    backToLobby: 'Retour au Salon',
    shareVictory: 'Partager la Victoire',
    victoryShared: 'Victoire copiée dans le presse-papiers !',
    moves: 'Coups',
    totalTime: 'Temps Total',
    captured: 'Capturés',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

// Safe retrieval of initial language
function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(PRIMARY_LANG_STORAGE_KEY) as Language | null;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'es' || saved === 'fr')) {
      return saved;
    }
    // Check browser language
    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === 'hi') return 'hi';
    if (navLang === 'es') return 'es';
    if (navLang === 'fr') return 'fr';
  } catch {
    // LocalStorage or navigator unavailable
  }
  return 'en';
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: TranslationKey) => TRANSLATIONS.en[key] || key,
  languages: SUPPORTED_LANGUAGES,
});

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(PRIMARY_LANG_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Safe fallback
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // Safe fallback
    }
  }, [language]);

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return (dict as Record<string, string>)[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}

// Standalone translation function for non-React contexts
export function getTranslation(key: TranslationKey, lang: Language = 'en'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return (dict as Record<string, string>)[key] || TRANSLATIONS.en[key] || key;
}
