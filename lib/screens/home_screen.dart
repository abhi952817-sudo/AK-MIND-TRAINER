import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../services/room_service.dart';
import '../services/auth_service.dart';
import '../ads/ad_manager.dart';
import 'lobby_room_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final RoomService _roomService = RoomService();
  final AuthService _authService = AuthService();
  final AdManager _adManager = AdManager();
  final TextEditingController _codeController = TextEditingController();

  bool _isBannerLoaded = false;
  dynamic _bannerAd; // BannerAd instance on mobile

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initAds();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _codeController.dispose();
    _bannerAd?.dispose();
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

  void _initAds() async {
    await _adManager.initialize();
    try {
      _bannerAd = _adManager.createBannerAd(
        onLoadedStateChanged: (loaded) {
          if (mounted) setState(() => _isBannerLoaded = loaded);
        },
      );
      _bannerAd.load();
    } catch (_) {
      // Graceful fallback on web or unsupported platforms
    }
  }

  void _handleQuickMatch() async {
    // Quick Match: create instant public match room
    final user = _authService.currentUser;
    final userName = user?.displayName ?? 'Guest Player';
    final userUid = user?.uid ?? 'guest_${DateTime.now().millisecondsSinceEpoch}';

    final room = await _roomService.createRoom(
      hostUid: userUid,
      hostName: userName,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      maxPlayers: 4,
    );

    // Auto-fill bots for immediate quick match fun
    _roomService.addBot();
    _roomService.addBot();
    _roomService.addBot();

    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => LobbyRoomScreen(room: room)),
    );
  }

  void _handleCreatePrivateRoom() async {
    // Private Room: Empty lobby waiting for invited friends
    final user = _authService.currentUser;
    final userName = user?.displayName ?? 'Host Player';
    final userUid = user?.uid ?? 'host_${DateTime.now().millisecondsSinceEpoch}';

    final room = await _roomService.createRoom(
      hostUid: userUid,
      hostName: userName,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Join Room with Code', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the 6-character room code shared by your friend:',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _codeController,
              textCapitalization: TextCapitalization.characters,
              maxLength: 6,
              style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 4, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                counterText: '',
                hintText: 'e.g. 7K9X2B',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.35), letterSpacing: 2),
                filled: true,
                fillColor: Colors.black38,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.greenPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              final code = _codeController.text.trim().toUpperCase();
              if (code.isEmpty) return;
              Navigator.pop(ctx);
              
              final user = _authService.currentUser;
              final success = await _roomService.joinRoom(
                roomCode: code,
                userUid: user?.uid ?? 'guest_join_${DateTime.now().millisecondsSinceEpoch}',
                userName: user?.displayName ?? 'Guest Challenger',
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
                  const SnackBar(
                    content: Text('Room not found or already full. Please check the code.'),
                    backgroundColor: AppConstants.redPrimary,
                  ),
                );
              }
            },
            child: const Text('Join Room', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _authService.currentUser;
    final displayName = user?.displayName ?? 'Guest Player';

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
              // Clean Guest / User Profile Bar (No fake coins or invented balances)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.white12,
                      child: const Icon(Icons.person, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                        ),
                        const Text(
                          'Online Mode',
                          style: TextStyle(color: AppConstants.greenLight, fontSize: 12),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.psychology, color: AppConstants.goldAccent, size: 16),
                          SizedBox(width: 5),
                          Text('Mind Game', style: TextStyle(fontSize: 12, color: Colors.white70)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 1),

              // Title Logo — AK MIND TRAINER
              Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF8C00).withOpacity(0.4),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.casino, size: 48, color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'AK MIND TRAINER',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.2,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Strategic Multiplayer Ludo Board Game',
                    style: TextStyle(color: Colors.white60, fontSize: 13),
                  ),
                ],
              ),

              const Spacer(flex: 1),

              // Responsive Action Buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    _buildMenuButton(
                      title: 'QUICK MATCH (VS BOTS / PLAY)',
                      subtitle: 'Jump directly into an active game',
                      icon: Icons.flash_on,
                      gradient: const LinearGradient(colors: [Color(0xFF00C853), Color(0xFF64DD17)]),
                      onTap: _handleQuickMatch,
                    ),
                    const SizedBox(height: 12),
                    _buildMenuButton(
                      title: 'CREATE PRIVATE ROOM',
                      subtitle: 'Host a room and invite friends via code',
                      icon: Icons.add_circle_outline,
                      gradient: const LinearGradient(colors: [Color(0xFF2979FF), Color(0xFF00E5FF)]),
                      onTap: _handleCreatePrivateRoom,
                    ),
                    const SizedBox(height: 12),
                    _buildMenuButton(
                      title: 'JOIN WITH ROOM CODE',
                      subtitle: 'Enter a friend\'s 6-digit room code',
                      icon: Icons.vpn_key,
                      gradient: const LinearGradient(colors: [Color(0xFFFF9100), Color(0xFFFFD700)]),
                      onTap: _showJoinDialog,
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 2),

              // Bottom Banner Ad area — gracefully collapses when ad is unavailable
              if (_isBannerLoaded && _bannerAd != null)
                Container(
                  width: double.infinity,
                  height: 50,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: Colors.black26,
                  ),
                  // In Flutter mobile this mounts the Google Mobile Ads widget
                  child: const SizedBox(
                    height: 50,
                    child: Center(
                      child: Text(
                        'Advertisement',
                        style: TextStyle(color: Colors.white30, fontSize: 10),
                      ),
                    ),
                  ),
                )
              else
                const SizedBox.shrink(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            child: Row(
              children: [
                Icon(icon, color: Colors.black87, size: 26),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: Colors.black.withOpacity(0.7),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
