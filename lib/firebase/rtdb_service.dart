import 'package:firebase_database/firebase_database.dart';

class RealtimeDatabaseService {
  final FirebaseDatabase _rtdb = FirebaseDatabase.instance;

  // Listen to game fast state: active dice roll, turn timer, token jumps
  Stream<DatabaseEvent> getGameStateStream(String roomId) {
    return _rtdb.ref('games/$roomId').onValue;
  }

  // Publish authoritative dice roll to low-latency RTDB
  Future<void> syncAuthoritativeDice(String roomId, int diceValue, String turnColor) async {
    await _rtdb.ref('games/$roomId').update({
      'diceValue': diceValue,
      'turn': turnColor,
      'timestamp': ServerValue.timestamp,
    });
  }

  // Set user connection presence heartbeat
  void setUserPresence(String roomId, String userId) {
    final presenceRef = _rtdb.ref('presence/$roomId/$userId');
    presenceRef.onDisconnect().set({'status': 'offline', 'lastSeen': ServerValue.timestamp});
    presenceRef.set({'status': 'online', 'timestamp': ServerValue.timestamp});
  }
}
