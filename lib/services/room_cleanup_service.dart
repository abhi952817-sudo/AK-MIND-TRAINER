import 'package:cloud_firestore/cloud_firestore.dart';

class RoomCleanupService {
  static final RoomCleanupService _instance = RoomCleanupService._internal();
  factory RoomCleanupService() => _instance;
  RoomCleanupService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Deletes abandoned rooms older than 2 hours to avoid orphan Firestore data
  Future<void> cleanStaleRooms() async {
    final cutoff = DateTime.now().subtract(const Duration(hours: 2));
    final snap = await _firestore
        .collection('rooms')
        .where('createdAt', isLessThan: Timestamp.fromDate(cutoff))
        .limit(25)
        .get();

    for (final doc in snap.docs) {
      await doc.reference.delete();
    }
  }

  /// Cleans expired floating chat messages
  Future<void> cleanExpiredMessages(String roomId) async {
    final snap = await _firestore
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .where('expiresAt', isLessThanOrEqualTo: Timestamp.now())
        .limit(50)
        .get();

    for (final doc in snap.docs) {
      await doc.reference.delete();
    }
  }
}
