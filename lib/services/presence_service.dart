import 'dart:async';
import 'package:firebase_database/firebase_database.dart';

class PresenceService {
  static final PresenceService _instance = PresenceService._internal();
  factory PresenceService() => _instance;
  PresenceService._internal();

  final FirebaseDatabase _rtdb = FirebaseDatabase.instance;
  StreamSubscription? _connectionSub;

  /// Starts real-time heartbeat and registers onDisconnect handlers
  void initUserPresence(String roomId, String userId) {
    final userRef = _rtdb.ref('presence/$roomId/$userId');
    final connectedRef = _rtdb.ref('.info/connected');

    _connectionSub = connectedRef.onValue.listen((event) {
      final isConnected = event.snapshot.value as bool? ?? false;
      if (isConnected) {
        // When client disconnects involuntarily, RTDB server writes offline status
        userRef.onDisconnect().set({
          'status': 'offline',
          'lastSeen': ServerValue.timestamp,
        });

        // Set active status
        userRef.set({
          'status': 'online',
          'connectedAt': ServerValue.timestamp,
        });
      }
    });
  }

  void dispose() {
    _connectionSub?.cancel();
  }
}
