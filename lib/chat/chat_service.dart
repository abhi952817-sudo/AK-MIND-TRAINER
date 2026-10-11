import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'chat_message_model.dart';

class FloatingChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Stream of active unexpired floating messages in a specific room
  Stream<List<FloatingChatMessage>> getActiveMessagesStream(String roomId) {
    return _firestore
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .where('expiresAt', isGreaterThan: Timestamp.now())
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => FloatingChatMessage.fromFirestore(doc))
              .where((msg) => !msg.isExpired)
              .toList();
        });
  }

  // Basic multilingual profanity filter (Hindi + English)
  static String sanitizeText(String text) {
    const blocked = ['abuse', 'spam', 'mc', 'bc', 'chutiya', 'fuck', 'bitch', 'asshole'];
    String sanitized = text;
    for (final word in blocked) {
      final reg = RegExp(word, caseSensitive: false);
      sanitized = sanitized.replaceAll(reg, '***');
    }
    return sanitized;
  }

  // Send Text Message
  Future<bool> sendTextMessage({
    required String roomId,
    required String senderId,
    required String senderName,
    required String text,
    int displayDurationSeconds = 10,
    int cooldownSeconds = 30,
  }) async {
    final now = DateTime.now();
    final sanitized = sanitizeText(text.trim());
    if (sanitized.isEmpty || sanitized.length > 120) return false;

    final docRef = _firestore.collection('rooms').doc(roomId).collection('messages').doc();
    final message = FloatingChatMessage(
      id: docRef.id,
      senderId: senderId,
      senderName: senderName,
      type: ChatMessageType.text,
      text: sanitized,
      createdAt: now,
      expiresAt: now.add(Duration(seconds: displayDurationSeconds)),
      cooldownUntil: now.add(Duration(seconds: cooldownSeconds)),
    );

    await docRef.set(message.toJson());
    return true;
  }

  // Send Emoji Message
  Future<bool> sendEmojiMessage({
    required String roomId,
    required String senderId,
    required String senderName,
    required String emoji,
    int displayDurationSeconds = 10,
    int cooldownSeconds = 30,
  }) async {
    final now = DateTime.now();
    final docRef = _firestore.collection('rooms').doc(roomId).collection('messages').doc();
    final message = FloatingChatMessage(
      id: docRef.id,
      senderId: senderId,
      senderName: senderName,
      type: ChatMessageType.emoji,
      emoji: emoji,
      createdAt: now,
      expiresAt: now.add(Duration(seconds: displayDurationSeconds)),
      cooldownUntil: now.add(Duration(seconds: cooldownSeconds)),
    );

    await docRef.set(message.toJson());
    return true;
  }

  // Clean expired messages periodically
  Future<void> cleanExpiredMessages(String roomId) async {
    final expiredSnap = await _firestore
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .where('expiresAt', isLessThanOrEqualTo: Timestamp.now())
        .get();

    for (final doc in expiredSnap.docs) {
      await doc.reference.delete();
    }
  }
}
