import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../services/room_service.dart';
import 'lobby_room_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final RoomService _roomService = RoomService();
  final TextEditingController _codeController = TextEditingController();

  void _handleCreateRoom() async {
    final room = await _roomService.createRoom(
      hostUid: 'user_local_1',
      hostName: 'Player 1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      maxPlayers: 4,
    );

    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => LobbyRoomScreen(room: room)),
    );
  }

  void _showJoinDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppConstants.cardDark,
        title: const Text('Join Room with Code', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: _codeController,
          textCapitalization: TextCapitalization.characters,
          style: const TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 2),
          decoration: InputDecoration(
            hintText: 'e.g. AB93KZ',
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
            filled: true,
            fillColor: Colors.black26,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () async {
              final code = _codeController.text.trim().toUpperCase();
              if (code.isEmpty) return;
              Navigator.pop(ctx);
              final success = await _roomService.joinRoom(
                roomCode: code,
                userUid: 'user_local_join',
                userName: 'Player Guest',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
              );
              if (success && mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => LobbyRoomScreen(room: _roomService.currentRoom!),
                  ),
                );
              } else if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Room not found or already full!')),
                );
              }
            },
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.4),
            radius: 1.2,
            colors: [Color(0xFF1B284A), Color(0xFF070B14)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top Bar with User Balance & Avatar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 22,
                      backgroundImage: NetworkImage(
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('KingAlex', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Level 14 • Pro', style: TextStyle(color: AppConstants.goldAccent, fontSize: 12)),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black40,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppConstants.goldAccent.withOpacity(0.5)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.monetization_on, color: AppConstants.goldAccent, size: 18),
                          SizedBox(width: 6),
                          Text('15,400', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Title Logo
              Column(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF8C00).withOpacity(0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.casino, size: 54, color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'AK LUDO 3D',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 3,
                      color: Colors.white,
                    ),
                  ),
                  const Text(
                    'Real-Time Authoritative Multiplayer',
                    style: TextStyle(color: Colors.white60, fontSize: 14),
                  ),
                ],
              ),
              const Spacer(),
              // Action Buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    _buildMenuButton(
                      title: 'PLAY ONLINE (QUICK MATCH)',
                      icon: Icons.flash_on,
                      gradient: const LinearGradient(colors: [Color(0xFF00C853), Color(0xFF64DD17)]),
                      onTap: _handleCreateRoom,
                    ),
                    const SizedBox(height: 12),
                    _buildMenuButton(
                      title: 'CREATE PRIVATE ROOM',
                      icon: Icons.add_circle_outline,
                      gradient: const LinearGradient(colors: [Color(0xFF2979FF), Color(0xFF00E5FF)]),
                      onTap: _handleCreateRoom,
                    ),
                    const SizedBox(height: 12),
                    _buildMenuButton(
                      title: 'JOIN WITH ROOM CODE',
                      icon: Icons.vpn_key,
                      gradient: const LinearGradient(colors: [Color(0xFFFF9100), Color(0xFFFFD700)]),
                      onTap: _showJoinDialog,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuButton({
    required String title,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return Container(
      width: double.infinity,
      height: 58,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.black87, size: 24),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
