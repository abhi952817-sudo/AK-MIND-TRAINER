import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';
import '../services/room_service.dart';
import 'game_screen.dart';

class LobbyRoomScreen extends StatefulWidget {
  final GameRoomModel room;
  const LobbyRoomScreen({super.key, required this.room});

  @override
  State<LobbyRoomScreen> createState() => _LobbyRoomScreenState();
}

class _LobbyRoomScreenState extends State<LobbyRoomScreen> {
  final RoomService _roomService = RoomService();
  late GameRoomModel _room;

  @override
  void initState() {
    super.initState();
    _room = widget.room;
    _roomService.roomStream.listen((updated) {
      if (mounted) {
        setState(() => _room = updated);
        if (_room.status == RoomStatus.playing) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => GameScreen(room: _room)),
          );
        }
      }
    });
  }

  void _onStartGame() {
    _roomService.startGame();
  }

  void _onAddBot() {
    _roomService.addBot();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GAME ROOM LOBBY'),
        actions: [
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: () {
              _roomService.leaveRoom('user_local_1');
              Navigator.pop(context);
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F172A), Color(0xFF020617)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                // Room Code Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppConstants.cardDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppConstants.goldAccent.withOpacity(0.4)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ROOM CODE', style: TextStyle(color: Colors.white54, fontSize: 12)),
                          const SizedBox(height: 4),
                          Text(
                            _room.roomCode,
                            style: const TextStyle(
                              color: AppConstants.goldAccent,
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 3,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, color: Colors.white70),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _room.roomCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Room code copied to clipboard!')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // 4 Player Slots
                Expanded(
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.9,
                    ),
                    itemCount: 4,
                    itemBuilder: (context, index) {
                      final hasPlayer = index < _room.players.length;
                      final player = hasPlayer ? _room.players[index] : null;
                      return _buildPlayerSlot(player, index);
                    },
                  ),
                ),
                // Bottom Control Buttons
                Row(
                  children: [
                    if (_room.players.length < 4)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _onAddBot,
                          icon: const Icon(Icons.smart_toy, color: Colors.white),
                          label: const Text('ADD BOT', style: TextStyle(color: Colors.white)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.white30),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    if (_room.players.length < 4) const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _room.players.length >= 2 ? _onStartGame : null,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: Text(
                          _room.players.length >= 2 ? 'START MATCH' : 'WAITING (MIN 2)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlayerSlot(PlayerModel? player, int index) {
    const slotColors = [
      AppConstants.redPrimary,
      AppConstants.greenPrimary,
      AppConstants.yellowPrimary,
      AppConstants.bluePrimary,
    ];
    final color = slotColors[index % slotColors.length];

    if (player == null) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.04),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12, style: BorderStyle.solid),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.person_add_alt_1, size: 40, color: Colors.white24),
            SizedBox(height: 8),
            Text('Waiting for player...', style: TextStyle(color: Colors.white30, fontSize: 12)),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppConstants.cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color, width: 2),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            alignment: Alignment.topRight,
            children: [
              CircleAvatar(
                radius: 32,
                backgroundImage: NetworkImage(player.avatarUrl),
              ),
              if (player.isHost)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppConstants.goldAccent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.star, size: 14, color: Colors.black87),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            player.displayName,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              player.color.name.toUpperCase(),
              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}
