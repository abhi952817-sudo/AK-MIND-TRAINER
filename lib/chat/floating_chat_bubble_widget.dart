import 'package:flutter/material.dart';
import 'chat_message_model.dart';

class FloatingChatBubbleWidget extends StatelessWidget {
  final FloatingChatMessage message;
  final bool isBottomRow;

  const FloatingChatBubbleWidget({
    super.key,
    required this.message,
    this.isBottomRow = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget content;

    switch (message.type) {
      case ChatMessageType.emoji:
        content = Text(
          message.emoji ?? '😄',
          style: const TextStyle(fontSize: 28),
        );
        break;
      case ChatMessageType.voice:
        content = Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.play_circle_fill, color: Colors.amber, size: 24),
            SizedBox(width: 6),
            Icon(Icons.graphic_eq, color: Colors.white70, size: 20),
            SizedBox(width: 4),
            Text('Voice', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        );
        break;
      case ChatMessageType.text:
      default:
        content = Text(
          message.text ?? '',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
        );
        break;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutBack,
      constraints: const BoxConstraints(maxWidth: 160),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.amber.withOpacity(0.6), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          content,
          const SizedBox(height: 2),
          Text(
            '▲',
            style: TextStyle(
              color: Colors.amber.withOpacity(0.6),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
