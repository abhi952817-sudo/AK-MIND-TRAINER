import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../core/board_coordinates.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';

class InteractiveLudoBoardWidget extends StatelessWidget {
  final GameRoomModel room;
  final Function(int tokenId)? onTokenTap;

  const InteractiveLudoBoardWidget({
    super.key,
    required this.room,
    this.onTokenTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double boardSize = constraints.maxWidth < constraints.maxHeight
            ? constraints.maxWidth
            : constraints.maxHeight;
        final double cellSize = boardSize / 15.0;

        return Center(
          child: Container(
            width: boardSize,
            height: boardSize,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.4),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                children: [
                  // Base 15x15 Grid Layout
                  _buildBoardGrid(boardSize, cellSize),

                  // Center Triangle Goal
                  _buildCenterGoal(boardSize, cellSize),

                  // Tokens for all active players
                  ..._buildAllTokens(cellSize),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBoardGrid(double boardSize, double cellSize) {
    return CustomPaint(
      size: Size(boardSize, boardSize),
      painter: _LudoBoardPainter(cellSize: cellSize),
    );
  }

  Widget _buildCenterGoal(double boardSize, double cellSize) {
    return Positioned(
      left: cellSize * 6,
      top: cellSize * 6,
      width: cellSize * 3,
      height: cellSize * 3,
      child: CustomPaint(
        painter: _CenterGoalPainter(),
      ),
    );
  }

  List<Widget> _buildAllTokens(double cellSize) {
    final List<Widget> tokenWidgets = [];

    for (final player in room.players) {
      final isCurrentPlayerTurn = room.currentTurnColor == player.color && room.hasRolledDice;

      for (int i = 0; i < player.tokens.length; i++) {
        final token = player.tokens[i];
        final GridPoint pt = _resolveTokenGridPoint(player.color, token, i);

        final double left = pt.c * cellSize;
        final double top = pt.r * cellSize;

        final bool canTap = isCurrentPlayerTurn && !token.isFinished;

        tokenWidgets.add(
          Positioned(
            left: left,
            top: top,
            width: cellSize,
            height: cellSize,
            child: GestureDetector(
              onTap: canTap ? () => onTokenTap?.call(token.id) : null,
              child: Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: cellSize * 0.78,
                  height: cellSize * 0.78,
                  decoration: BoxDecoration(
                    color: _getColor(player.color),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCurrentPlayerTurn ? AppConstants.goldAccent : Colors.white,
                      width: isCurrentPlayerTurn ? 2.5 : 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.35),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Container(
                      width: cellSize * 0.32,
                      height: cellSize * 0.32,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontSize: cellSize * 0.22,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      }
    }

    return tokenWidgets;
  }

  GridPoint _resolveTokenGridPoint(PlayerColor color, TokenModel token, int index) {
    // 1. In Nest / Base
    if (token.isInBase) {
      final bases = BoardCoordinates.basePositions[color];
      if (bases != null && index < bases.length) {
        return bases[index];
      }
      return const GridPoint(7, 7);
    }

    // 2. Finished in Goal
    if (token.isFinished) {
      return const GridPoint(7, 7);
    }

    // 3. In Home stretch (steps 51..56)
    if (token.step > 50) {
      final homeCol = BoardCoordinates.homeColumns[color];
      final homeIdx = token.step - 51;
      if (homeCol != null && homeIdx < homeCol.length) {
        return homeCol[homeIdx];
      }
      return const GridPoint(7, 7);
    }

    // 4. Common perimeter track
    final startIdx = AppConstants.startStepIndex[color] ?? 0;
    final trackIdx = (startIdx + token.step) % 52;
    return BoardCoordinates.commonTrack[trackIdx];
  }

  Color _getColor(PlayerColor color) {
    switch (color) {
      case PlayerColor.red:
        return AppConstants.redPrimary;
      case PlayerColor.green:
        return AppConstants.greenPrimary;
      case PlayerColor.yellow:
        return AppConstants.yellowPrimary;
      case PlayerColor.blue:
        return AppConstants.bluePrimary;
    }
  }
}

class _LudoBoardPainter extends CustomPainter {
  final double cellSize;
  _LudoBoardPainter({required this.cellSize});

  @override
  void paint(Canvas canvas, Size size) {
    final borderPaint = Paint()
      ..color = const Color(0xFF333333)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    // Draw nests (quadrants)
    _drawNest(canvas, 0, 0, AppConstants.redPrimary);
    _drawNest(canvas, 0, cellSize * 9, AppConstants.greenPrimary);
    _drawNest(canvas, cellSize * 9, cellSize * 9, AppConstants.yellowPrimary);
    _drawNest(canvas, cellSize * 9, 0, AppConstants.bluePrimary);

    // Draw grid track lines
    for (int r = 0; r <= 15; r++) {
      canvas.drawLine(
        Offset(0, r * cellSize),
        Offset(size.width, r * cellSize),
        borderPaint,
      );
    }
    for (int c = 0; c <= 15; c++) {
      canvas.drawLine(
        Offset(c * cellSize, 0),
        Offset(c * cellSize, size.height),
        borderPaint,
      );
    }

    // Color home column pathways
    final redPaint = Paint()..color = AppConstants.redPrimary;
    final greenPaint = Paint()..color = AppConstants.greenPrimary;
    final yellowPaint = Paint()..color = AppConstants.yellowPrimary;
    final bluePaint = Paint()..color = AppConstants.bluePrimary;

    // Red home path (row 7, col 1..5) & start cell (row 6, col 1)
    canvas.drawRect(Rect.fromLTWH(cellSize * 1, cellSize * 6, cellSize, cellSize), redPaint);
    for (int c = 1; c <= 5; c++) {
      canvas.drawRect(Rect.fromLTWH(c * cellSize, 7 * cellSize, cellSize, cellSize), redPaint);
    }

    // Green home path (row 1..5, col 7) & start cell (row 1, col 8)
    canvas.drawRect(Rect.fromLTWH(cellSize * 8, cellSize * 1, cellSize, cellSize), greenPaint);
    for (int r = 1; r <= 5; r++) {
      canvas.drawRect(Rect.fromLTWH(7 * cellSize, r * cellSize, cellSize, cellSize), greenPaint);
    }

    // Yellow home path (row 7, col 9..13) & start cell (row 8, col 13)
    canvas.drawRect(Rect.fromLTWH(cellSize * 13, cellSize * 8, cellSize, cellSize), yellowPaint);
    for (int c = 9; c <= 13; c++) {
      canvas.drawRect(Rect.fromLTWH(c * cellSize, 7 * cellSize, cellSize, cellSize), yellowPaint);
    }

    // Blue home path (row 9..13, col 7) & start cell (row 13, col 6)
    canvas.drawRect(Rect.fromLTWH(cellSize * 6, cellSize * 13, cellSize, cellSize), bluePaint);
    for (int r = 9; r <= 13; r++) {
      canvas.drawRect(Rect.fromLTWH(7 * cellSize, r * cellSize, cellSize, cellSize), bluePaint);
    }

    // Draw safe stars
    _drawSafeStar(canvas, 6, 1);
    _drawSafeStar(canvas, 2, 6);
    _drawSafeStar(canvas, 1, 8);
    _drawSafeStar(canvas, 6, 12);
    _drawSafeStar(canvas, 8, 13);
    _drawSafeStar(canvas, 12, 8);
    _drawSafeStar(canvas, 13, 6);
    _drawSafeStar(canvas, 8, 2);
  }

  void _drawNest(Canvas canvas, double left, double top, Color color) {
    final rect = Rect.fromLTWH(left, top, cellSize * 6, cellSize * 6);
    final fillPaint = Paint()..color = color;
    canvas.drawRect(rect, fillPaint);

    final innerRect = Rect.fromLTWH(left + cellSize * 1, top + cellSize * 1, cellSize * 4, cellSize * 4);
    final whitePaint = Paint()..color = Colors.white;
    canvas.drawRRect(RRect.fromRectAndRadius(innerRect, Radius.circular(cellSize * 0.4)), whitePaint);

    // Nest token circles
    final circlePaint = Paint()..color = color;
    final r1 = Offset(left + cellSize * 2, top + cellSize * 2);
    final r2 = Offset(left + cellSize * 4, top + cellSize * 2);
    final r3 = Offset(left + cellSize * 2, top + cellSize * 4);
    final r4 = Offset(left + cellSize * 4, top + cellSize * 4);
    final radius = cellSize * 0.55;

    canvas.drawCircle(r1, radius, circlePaint);
    canvas.drawCircle(r2, radius, circlePaint);
    canvas.drawCircle(r3, radius, circlePaint);
    canvas.drawCircle(r4, radius, circlePaint);
  }

  void _drawSafeStar(Canvas canvas, int r, int c) {
    final textPainter = TextPainter(
      text: const TextSpan(text: '★', style: TextStyle(color: Colors.black54, fontSize: 13, fontWeight: FontWeight.bold)),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(c * cellSize + cellSize * 0.28, r * cellSize + cellSize * 0.16));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CenterGoalPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final center = Offset(w / 2, h / 2);

    // Red triangle (Left)
    final redPath = Path()
      ..moveTo(0, 0)
      ..lineTo(center.dx, center.dy)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(redPath, Paint()..color = AppConstants.redPrimary);

    // Green triangle (Top)
    final greenPath = Path()
      ..moveTo(0, 0)
      ..lineTo(center.dx, center.dy)
      ..lineTo(w, 0)
      ..close();
    canvas.drawPath(greenPath, Paint()..color = AppConstants.greenPrimary);

    // Yellow triangle (Right)
    final yellowPath = Path()
      ..moveTo(w, 0)
      ..lineTo(center.dx, center.dy)
      ..lineTo(w, h)
      ..close();
    canvas.drawPath(yellowPath, Paint()..color = AppConstants.yellowPrimary);

    // Blue triangle (Bottom)
    final bluePath = Path()
      ..moveTo(0, h)
      ..lineTo(center.dx, center.dy)
      ..lineTo(w, h)
      ..close();
    canvas.drawPath(bluePath, Paint()..color = AppConstants.bluePrimary);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
