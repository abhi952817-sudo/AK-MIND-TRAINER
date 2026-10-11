import 'package:audioplayers/audioplayers.dart';

enum GameMusicTheme { home, lobby, gameplay, victory }

class AudioManager {
  static final AudioManager _instance = AudioManager._internal();
  factory AudioManager() => _instance;
  AudioManager._internal();

  final AudioPlayer _sfxPlayer = AudioPlayer();
  final AudioPlayer _bgmPlayer = AudioPlayer();
  final AudioPlayer _ambientPlayer = AudioPlayer();

  bool isSfxEnabled = true;
  bool isMusicEnabled = true;
  bool isVoiceChatEnabled = true;
  GameMusicTheme currentTheme = GameMusicTheme.home;

  Future<void> init() async {
    await _bgmPlayer.setReleaseMode(ReleaseMode.loop);
    await _ambientPlayer.setReleaseMode(ReleaseMode.loop);
    _bgmPlayer.setVolume(0.5);
    _sfxPlayer.setVolume(0.85);
  }

  // Switch Background Music by Scene
  void playMusic(GameMusicTheme theme) async {
    currentTheme = theme;
    if (!isMusicEnabled) return;

    String assetPath;
    switch (theme) {
      case GameMusicTheme.home:
        assetPath = 'audio/home_theme.mp3';
        break;
      case GameMusicTheme.lobby:
        assetPath = 'audio/lobby_theme.mp3';
        break;
      case GameMusicTheme.gameplay:
        assetPath = 'audio/gameplay_battle.mp3';
        break;
      case GameMusicTheme.victory:
        assetPath = 'audio/victory_orchestral.mp3';
        break;
    }

    try {
      await _bgmPlayer.stop();
      await _bgmPlayer.play(AssetSource(assetPath));
    } catch (_) {}
  }

  void stopMusic() {
    _bgmPlayer.stop();
  }

  // Sound Effects
  void playDiceRoll() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/dice_3d_roll.mp3'));
  }

  void playTokenHop() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/token_jump.mp3'));
  }

  void playCapture() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/token_capture_smash.mp3'));
  }

  void playSafeCell() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/safe_star_chime.mp3'));
  }

  void playTurnAlert() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/turn_alert.mp3'));
  }

  void playCountdownTick() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/clock_tick.mp3'));
  }

  void playMessageReceived() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/chat_pop.mp3'));
  }

  void playVoiceNoteReceived() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/voice_pop.mp3'));
  }

  void playWinCelebration() {
    if (!isSfxEnabled) return;
    _sfxPlayer.play(AssetSource('audio/win_fanfare.mp3'));
  }

  // Toggles
  void toggleSfx() {
    isSfxEnabled = !isSfxEnabled;
  }

  void toggleMusic() {
    isMusicEnabled = !isMusicEnabled;
    if (isMusicEnabled) {
      playMusic(currentTheme);
    } else {
      stopMusic();
    }
  }

  void toggleVoiceChat() {
    isVoiceChatEnabled = !isVoiceChatEnabled;
  }

  void dispose() {
    _sfxPlayer.dispose();
    _bgmPlayer.dispose();
    _ambientPlayer.dispose();
  }
}
