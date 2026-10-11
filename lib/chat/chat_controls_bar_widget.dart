import 'package:flutter/material.dart';

class ChatControlsBarWidget extends StatelessWidget {
  final int cooldownSecondsRemaining;
  final VoidCallback onOpenEmojiPanel;
  final VoidCallback onOpenTextComposer;
  final VoidCallback onStartVoiceRecording;
  final VoidCallback onStopVoiceRecording;
  final bool isRecordingVoice;

  const ChatControlsBarWidget({
    super.key,
    required this.cooldownSecondsRemaining,
    required this.onOpenEmojiPanel,
    required this.onOpenTextComposer,
    required this.onStartVoiceRecording,
    required this.onStopVoiceRecording,
    this.isRecordingVoice = false,
  });

  @override
  Widget build(BuildContext context) {
    final bool isOnCooldown = cooldownSecondsRemaining > 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withOpacity(0.9),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // [😀 Emoji]
          _buildActionButton(
            label: '😀',
            title: 'Emoji',
            disabled: isOnCooldown,
            onTap: onOpenEmojiPanel,
          ),
          const SizedBox(width: 8),

          // [🎤 Voice]
          GestureDetector(
            onLongPressStart: (_) {
              if (!isOnCooldown) onStartVoiceRecording();
            },
            onLongPressEnd: (_) {
              if (!isOnCooldown) onStopVoiceRecording();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isRecordingVoice
                    ? Colors.redAccent
                    : (isOnCooldown ? Colors.white10 : const Color(0xFF1E293B)),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isRecordingVoice ? Colors.red : Colors.white12,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.mic,
                    size: 16,
                    color: isRecordingVoice ? Colors.white : Colors.amber,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isRecordingVoice ? 'Recording...' : 'Voice',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isRecordingVoice ? Colors.white : Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),

          // [Aa Text]
          _buildActionButton(
            label: 'Aa',
            title: 'Text',
            disabled: isOnCooldown,
            onTap: onOpenTextComposer,
          ),

          // Cooldown indicator if cooling down
          if (isOnCooldown) ...[
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${cooldownSecondsRemaining}s',
                style: const TextStyle(
                  color: Colors.amber,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required String title,
    required bool disabled,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: disabled ? null : onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: disabled ? Colors.white10 : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            Text(label, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: disabled ? Colors.white30 : Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
