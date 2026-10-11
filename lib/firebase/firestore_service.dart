import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Create room document
  Future<void> createRoomDoc(GameRoomModel room) async {
    await _firestore.collection('rooms').doc(room.id).set(room.toJson());
  }

  // Real-time room stream
  Stream<GameRoomModel?> getRoomStream(String roomId) {
    return _firestore.collection('rooms').doc(roomId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) return null;
      return GameRoomModel.fromJson(snapshot.data()!);
    });
  }

  // Join room in Firestore
  Future<void> joinRoomDoc(String roomId, PlayerModel player) async {
    final docRef = _firestore.collection('rooms').doc(roomId);
    await _firestore.runTransaction((tx) async {
      final snap = await tx.get(docRef);
      if (!snap.exists) throw Exception('Room does not exist');
      final room = GameRoomModel.fromJson(snap.data()!);
      if (room.isFull) throw Exception('Room is already full');
      final updatedPlayers = [...room.players, player];
      tx.update(docRef, {
        'players': updatedPlayers.map((p) => p.toJson()).toList(),
      });
    });
  }

  // Update room state
  Future<void> updateRoom(String roomId, Map<String, dynamic> updates) async {
    await _firestore.collection('rooms').doc(roomId).update(updates);
  }

  // User profile storage
  Future<void> saveUserProfile({
    required String uid,
    required String displayName,
    required String email,
    required String photoUrl,
  }) async {
    await _firestore.collection('users').doc(uid).set({
      'uid': uid,
      'displayName': displayName,
      'email': email,
      'photoUrl': photoUrl,
      'coins': 2500,
      'diamonds': 50,
      'winCount': 0,
      'gamesPlayed': 0,
      'lastActive': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
