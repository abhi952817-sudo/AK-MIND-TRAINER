import 'dart:math';
import 'package:flutter/material.dart';
import '../audio/audio_manager.dart';

class Dice3DWidget extends StatefulWidget {
  final int value; // Authoritative value 1..6
  final bool isRolling;
  final bool canRoll;
  final VoidCallback onRoll;
  final String? activePlayerName;
  final int? turnTimeRemaining;

  const Dice3DWidget({
    super.key,
    required this.value,
    required this.isRolling,
    required this.canRoll,
    required this.onRoll,
    this.activePlayerName,
    this.turnTimeRemaining,
  });

  @override
  State<Dice3DWidget> createState() => _Dice3DWidgetState();
}

class _Dice3DWidgetState extends State<Dice3DWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _bounceAnimation;
  double _rotationX = 0;
  double _rotationY = 0;
  double _rotationZ = 0;
  final Random _rnd = Random();

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _bounceAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    );

    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        AudioManager().playTokenHop(); // Impact landing sound
      }
    });
  }

  @override
  void didUpdateWidget(covariant Dice3DWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isRolling && !oldWidget.isRolling) {
      _startRollAnimation();
    }
  }

  void _startRollAnimation() {
    AudioManager().playDiceRoll();

    // Randomize multi-axis 3D tumbling rotation
    _rotationX += (2 + _rnd.nextInt(2)) * pi * 2;
    _rotationY += (2 + _rnd.nextInt(2)) * pi * 2;
    _rotationZ += (_rnd.nextBool() ? 1 : -1) * pi * 2;

    _animController.forward(from: 0.0);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Widget _buildPip(bool isOne) {
    return Container(
      width: isOne ? 14 : 10,
      height: isOne ? 14 : 10,
      decoration: BoxDecoration(
        color: isOne ? Colors.redAccent : const Color(0xFF0F172A),
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
    );
  }

  Widget _buildFace(int val) {
    switch (val) {
      case 1:
        return Center(child: _buildPip(true));
      case 2:
        return Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Align(alignment: Alignment.topLeft, child: _buildPip(false)),
              Align(alignment: Alignment.bottomRight, child: _buildPip(false)),
            ],
          ),
        );
      case 3:
        return Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Align(alignment: Alignment.topLeft, child: _buildPip(false)),
              Center(child: _buildPip(false)),
              Align(alignment: Alignment.bottomRight, child: _buildPip(false)),
            ],
          ),
        );
      case 4:
        return Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
            ],
          ),
        );
      case 5:
        return Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
              Center(child: _buildPip(false)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
            ],
          ),
        );
      case 6:
      default:
        return Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_buildPip(false), _buildPip(false)],
              ),
            ],
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _animController,
          builder: (context, child) {
            final progress = _animController.value;
            final elevationOffset = sin(progress * pi) * -38;
            final shadowScale = 1.0 - sin(progress * pi) * 0.45;

            return Stack(
              alignment: Alignment.center,
              children: [
                // Ground shadow beneath 3D dice
                Transform.translate(
                  offset: const Offset(0, 36),
                  child: Transform.scale(
                    scale: shadowScale,
                    child: Container(
                      width: 50,
                      height: 14,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),

                // 3D Cube with perspective transformation
                Transform.translate(
                  offset: Offset(0, elevationOffset),
                  child: Transform(
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001) // Perspective depth
                      ..rotateX(_rotationX * progress)
                      ..rotateY(_rotationY * progress)
                      ..rotateZ(_rotationZ * progress),
                    alignment: Alignment.center,
                    child: GestureDetector(
                      onTap: widget.canRoll && !widget.isRolling
                          ? widget.onRoll
                          : null,
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: widget.canRoll
                                ? Colors.amber
                                : Colors.white24,
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: widget.canRoll
                                  ? Colors.amber.withOpacity(0.4)
                                  : Colors.black45,
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: _buildFace(widget.value),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),

        const SizedBox(height: 8),

        // Turn indicator & countdown
        if (widget.turnTimeRemaining != null)
          Text(
            widget.canRoll
                ? 'Your Turn (${widget.turnTimeRemaining}s)'
                : '${widget.activePlayerName ?? "Opponent"} (${widget.turnTimeRemaining}s)',
            style: TextStyle(
              color: (widget.turnTimeRemaining! <= 5)
                  ? Colors.redAccent
                  : Colors.amber,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
      ],
    );
  }
}
