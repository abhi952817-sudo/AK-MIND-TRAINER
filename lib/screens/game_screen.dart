import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';
import '../services/authoritative_engine.dart';
import '../services/room_service.dart';
import '../audio/audio_manager.dart';
import '../widgets/dice_3d_widget.dart';

class GameScreen extends StatefulWidget {
  final GameRoomModel room;
  const GameScreen({super.key, required this.room});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with SingleTickerProviderStateMixin {
  late GameRoomModel _room;
  final RoomService _roomService = RoomService();
  final AudioManager _audio = AudioManager();
  bool _isRolling = false;

  @override
  void initState() {
    super.initState();
    _room = widget.room;
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

      // If no valid move exists, auto-pass turn
      if (movable.isEmpty) {
        Future.delayed(const Duration(seconds: 1), () {
          if (!mounted) return;
          _handleAutoPass();
        });
      } else if (movable.length == 1) {
        // Auto-move if only 1 token can move
        _moveToken(movable.first);
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

      // Handle Bot turn if next player is bot
      final nextPlayer = _room.activePlayer;
      if (nextPlayer != null && nextPlayer.isBot && _room.status == RoomStatus.playing) {
        Future.delayed(const Duration(milliseconds: 900), () {
          if (mounted) _rollAuthoritativeDice();
        });
      }
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.boardBackground,
      appBar: AppBar(
        title: Text('MATCH #${_room.roomCode}'),
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
            // Top Players Status Banner
            _buildPlayerHeader(_room.players.firstWhere((p) => p.color == PlayerColor.green, orElse: () => _room.players.first)),
            const Spacer(),
            // 3D Ludo Board Area
            Center(
              child: Container(
                width: 340,
                height: 340,
                decoration: BoxDecoration(
                  color: AppConstants.cardDark,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.6),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    '3D LUDO BOARD CANVAS\n(Active Turn: ${_room.currentTurnColor.name.toUpperCase()})',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
            const Spacer(),
            // Bottom Turn & Interactive Dice Controller
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppConstants.cardDark,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildPlayerAvatar(_room.activePlayer),
                  // Animated 3D Physical Dice Widget
                  Dice3DWidget(
                    value: _room.diceValue,
                    isRolling: _isRolling,
                    canRoll: !_room.hasRolledDice,
                    onRoll: _rollAuthoritativeDice,
                    activePlayerName: _room.activePlayer?.name,
                    turnTimeRemaining: _room.turnTimeRemaining,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerHeader(PlayerModel player) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          CircleAvatar(backgroundImage: NetworkImage(player.avatarUrl)),
          const SizedBox(width: 10),
          Text(player.displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildPlayerAvatar(PlayerModel? player) {
    if (player == null) return const SizedBox.shrink();
    return Row(
      children: [
        CircleAvatar(
          radius: 26,
          backgroundImage: NetworkImage(player.avatarUrl),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(player.displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text('Turn Active', style: TextStyle(color: AppConstants.goldAccent, fontSize: 12)),
          ],
        ),
      ],
    );
  }
}
