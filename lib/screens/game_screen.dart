import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';
import '../services/authoritative_engine.dart';
import '../services/room_service.dart';
import '../audio/audio_manager.dart';
import '../widgets/dice_3d_widget.dart';
import '../widgets/interactive_ludo_board.dart';
import '../ads/ad_manager.dart';

class GameScreen extends StatefulWidget {
  final GameRoomModel room;
  const GameScreen({super.key, required this.room});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  late GameRoomModel _room;
  final RoomService _roomService = RoomService();
  final AudioManager _audio = AudioManager();
  final AdManager _adManager = AdManager();
  bool _isRolling = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _room = widget.room;

    // Track active gameplay time strictly during match
    _adManager.onMatchStarted();

    // Trigger initial bot roll if host is bot
    _checkAndTriggerBotTurn();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Mark match ended for gameplay time tracker
    _adManager.onMatchEnded();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _adManager.onGameplayPaused();
    } else if (state == AppLifecycleState.resumed) {
      _adManager.onGameplayResumed();
    }
  }

  void _checkAndTriggerBotTurn() {
    final active = _room.activePlayer;
    if (active != null && active.isBot && _room.status == RoomStatus.playing && !_room.hasRolledDice) {
      Future.delayed(const Duration(milliseconds: 900), () {
        if (mounted && !_room.hasRolledDice && _room.activePlayer?.isBot == true) {
          _rollAuthoritativeDice();
        }
      });
    }
  }

  void _rollAuthoritativeDice() {
    if (_isRolling || _room.hasRolledDice) return;

    setState(() => _isRolling = true);
    _audio.playDiceRoll();

    Future.delayed(const Duration(milliseconds: 700), () {
      final dice = AuthoritativeLudoEngine.rollAuthoritativeDice();
      final active = _room.activePlayer;
      final movable = active != null ? AuthoritativeLudoEngine.getMovableTokenIds(active, dice) : <int>[];

      setState(() {
        _isRolling = false;
        _room = _room.copyWith(diceValue: dice, hasRolledDice: true);
      });

      // If no valid move exists, auto-pass turn after short delay
      if (movable.isEmpty) {
        Future.delayed(const Duration(milliseconds: 1000), () {
          if (!mounted) return;
          _handleAutoPass();
        });
      } else if (movable.length == 1) {
        // Auto-move if only 1 token is movable
        Future.delayed(const Duration(milliseconds: 400), () {
          if (mounted) _moveToken(movable.first);
        });
      } else if (active != null && active.isBot) {
        // Bot auto-selects best movable token
        Future.delayed(const Duration(milliseconds: 600), () {
          if (mounted) _moveToken(movable.first);
        });
      }
    });
  }

  void _moveToken(int tokenId) {
    final active = _room.activePlayer;
    if (active == null) return;

    final result = AuthoritativeLudoEngine.executeTokenMove(
      room: _room,
      requestingUserId: active.uid,
      tokenId: tokenId,
    );

    if (result.isValid && result.updatedRoom != null) {
      if (result.wasCapture) {
        _audio.playCapture();
      } else if (result.reachedHome) {
        _audio.playWin();
      } else {
        _audio.playTokenHop();
      }

      setState(() {
        _room = result.updatedRoom!;
      });

      _roomService.updateState(_room);

      // Check if match finished
      if (_room.status == RoomStatus.finished) {
        _handleMatchFinished();
        return;
      }

      // Handle next turn if next player is bot
      _checkAndTriggerBotTurn();
    }
  }

  void _handleAutoPass() {
    final moveResult = AuthoritativeLudoEngine.executeTokenMove(
      room: _room,
      requestingUserId: _room.activePlayer?.uid ?? '',
      tokenId: -99, // Force turn skip
    );
    if (moveResult.updatedRoom != null) {
      setState(() => _room = moveResult.updatedRoom!);
      _roomService.updateState(_room);
      _checkAndTriggerBotTurn();
    }
  }

  void _handleMatchFinished() {
    _adManager.onMatchEnded();

    // Natural break: Check if >= 2 hrs (interstitial) or >= 4 hrs (video) accumulated
    _adManager.checkAndShowNaturalBreakAd(
      onProceed: () {
        if (!mounted) return;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppConstants.cardDark,
            title: const Text('MATCH FINISHED!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            content: Text(
              'Winner: ${_room.players.firstWhere((p) => p.uid == _room.winnerId, orElse: () => _room.players.first).displayName}',
              style: const TextStyle(color: AppConstants.goldAccent, fontSize: 16),
            ),
            actions: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppConstants.greenPrimary),
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context); // Return to home
                },
                child: const Text('Back to Home', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleExitMatch() {
    // Show confirmation dialog before leaving
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.cardDark,
        title: const Text('Leave Match?', style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure you want to leave this active game?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Stay', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppConstants.redPrimary),
            onPressed: () {
              Navigator.pop(ctx);
              _adManager.onMatchEnded();
              // Natural break evaluation on voluntary exit
              _adManager.checkAndShowNaturalBreakAd(
                onProceed: () {
                  if (mounted) Navigator.pop(context);
                },
              );
            },
            child: const Text('Leave Game', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _handleExitMatch();
        return false;
      },
      child: Scaffold(
        backgroundColor: AppConstants.boardBackground,
        appBar: AppBar(
          title: Text(
            'Ludo #${_room.roomCode}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleExitMatch,
          ),
          actions: [
            IconButton(
              icon: Icon(_audio.isMuted ? Icons.volume_off : Icons.volume_up),
              onPressed: () => setState(() => _audio.toggleMute()),
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Player Status Top Indicators
              _buildPlayersStatusBar(),

              const SizedBox(height: 8),

              // Interactive 15x15 Ludo Board
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: InteractiveLudoBoardWidget(
                    room: _room,
                    onTokenTap: _moveToken,
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // Bottom Turn & Animated 3D Physical Dice Controller
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: const BoxDecoration(
                  color: AppConstants.cardDark,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, -3)),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildActivePlayerBanner(_room.activePlayer),
                    Dice3DWidget(
                      value: _room.diceValue,
                      isRolling: _isRolling,
                      canRoll: !_room.hasRolledDice && (_room.activePlayer?.isBot != true),
                      onRoll: _rollAuthoritativeDice,
                      activePlayerName: _room.activePlayer?.displayName,
                      turnTimeRemaining: _room.turnTimeRemaining,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlayersStatusBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: _room.players.map((p) {
          final isTurn = _room.currentTurnColor == p.color;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isTurn ? Colors.white12 : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: isTurn ? Border.all(color: AppConstants.goldAccent, width: 1.5) : null,
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: _getPlayerColor(p.color),
                  child: p.isBot
                      ? const Icon(Icons.smart_toy, size: 14, color: Colors.white)
                      : const Icon(Icons.person, size: 14, color: Colors.white),
                ),
                const SizedBox(width: 6),
                Text(
                  p.displayName.length > 7 ? '${p.displayName.substring(0, 6)}…' : p.displayName,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isTurn ? FontWeight.bold : FontWeight.normal,
                    color: isTurn ? Colors.white : Colors.white60,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActivePlayerBanner(PlayerModel? player) {
    if (player == null) return const SizedBox.shrink();
    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: _getPlayerColor(player.color),
          child: Icon(player.isBot ? Icons.smart_toy : Icons.person, color: Colors.white, size: 28),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              player.displayName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
            ),
            const SizedBox(height: 2),
            Text(
              _room.hasRolledDice ? 'Tap a highlighted token' : 'Tap dice to roll',
              style: const TextStyle(color: AppConstants.goldAccent, fontSize: 11),
            ),
          ],
        ),
      ],
    );
  }

  Color _getPlayerColor(PlayerColor c) {
    switch (c) {
      case PlayerColor.red:
        return AppConstants.redPrimary;
      case PlayerColor.green:
        return AppConstants.greenPrimary;
      case PlayerColor.yellow:
        return AppConstants.yellowPrimary;
      case PlayerColor.blue:
        return AppConstants.bluePrimary;
    }
  }
}
