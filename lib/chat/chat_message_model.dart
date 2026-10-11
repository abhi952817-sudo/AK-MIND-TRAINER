import 'package:cloud_firestore/cloud_firestore.dart';

enum ChatMessageType { text, emoji, voice }

class FloatingChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final ChatMessageType type;
  final String? text;
  final String? emoji;
  final String? audioUrl;
  final double? audioDuration;
  final DateTime createdAt;
  final DateTime expiresAt;
  final DateTime cooldownUntil;

  FloatingChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.type,
    this.text,
    this.emoji,
    this.audioUrl,
    this.audioDuration,
    required this.createdAt,
    required this.expiresAt,
    required this.cooldownUntil,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  Map<String, dynamic> toJson() => {
    'id': id,
    'senderId': senderId,
    'senderName': senderName,
    'type': type.name,
    'text': text,
    'emoji': emoji,
    'audioUrl': audioUrl,
    'audioDuration': audioDuration,
    'createdAt': Timestamp.fromDate(createdAt),
    'expiresAt': Timestamp.fromDate(expiresAt),
    'cooldownUntil': Timestamp.fromDate(cooldownUntil),
  };

  factory FloatingChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return FloatingChatMessage(
      id: doc.id,
      senderId: data['senderId'] as String,
      senderName: data['senderName'] as String,
      type: ChatMessageType.values.byName(data['type'] as String? ?? 'text'),
      text: data['text'] as String?,
      emoji: data['emoji'] as String?,
      audioUrl: data['audioUrl'] as String?,
      audioDuration: (data['audioDuration'] as num?)?.toDouble(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      expiresAt: (data['expiresAt'] as Timestamp?)?.toDate() ?? DateTime.now().add(const Duration(seconds: 10)),
      cooldownUntil: (data['cooldownUntil'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
