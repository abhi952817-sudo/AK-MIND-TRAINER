import 'dart:math';
import '../core/constants.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';

class MoveResult {
  final bool isValid;
  final String message;
  final GameRoomModel? updatedRoom;
  final bool wasCapture;
  final bool reachedHome;
  final bool grantsBonusTurn;

  MoveResult({
    required this.isValid,
    this.message = '',
    this.updatedRoom,
    this.wasCapture = false,
    this.reachedHome = false,
    this.grantsBonusTurn = false,
  });
}

class AuthoritativeLudoEngine {
  static final Random _secureRandom = Random.secure();

  /// Authoritative server-side roll dice
  static int rollAuthoritativeDice() {
    return _secureRandom.nextInt(6) + 1;
  }

  /// Calculates whether a token can legally move with the current dice roll
  static bool canTokenMove(TokenModel token, int diceValue) {
    if (token.isFinished) return false;

    // Token inside home base: Needs 6 to unlock into start position
    if (token.isInBase) {
      return diceValue == 6;
    }

    // Maximum steps is 57 (0 = start, 50 = common loop end, 51..55 = home alley, 56 = home goal)
    if (token.step + diceValue > 56) {
      return false; // Cannot overshoot target home
    }

    return true;
  }

  /// Finds all movable token IDs for the active player
  static List<int> getMovableTokenIds(PlayerModel player, int diceValue) {
    final List<int> movable = [];
    for (final token in player.tokens) {
      if (canTokenMove(token, diceValue)) {
        movable.add(token.id);
      }
    }
    return movable;
  }

  /// Performs an authoritative token move
  static MoveResult executeTokenMove({
    required GameRoomModel room,
    required String requestingUserId,
    required int tokenId,
  }) {
    // 1. Validate game is active
    if (room.status != RoomStatus.playing) {
      return MoveResult(isValid: false, message: 'Game is not in active state');
    }

    // 2. Validate it is the player's turn
    final activePlayer = room.activePlayer;
    if (activePlayer == null || activePlayer.uid != requestingUserId) {
      return MoveResult(isValid: false, message: 'Not your turn');
    }

    // 3. Validate dice was already rolled
    if (!room.hasRolledDice) {
      return MoveResult(isValid: false, message: 'Must roll dice first');
    }

    final dice = room.diceValue;
    final token = activePlayer.tokens.firstWhere((t) => t.id == tokenId);

    if (!canTokenMove(token, dice)) {
      return MoveResult(isValid: false, message: 'Illegal move for this token');
    }

    int nextStep;
    if (token.isInBase) {
      nextStep = 0; // Moves to starting cell
    } else {
      nextStep = token.step + dice;
    }

    final bool reachedHome = nextStep == 56;
    final bool isFinished = reachedHome;

    // Check if new position is a safe cell
    final bool isSafe = _isPositionSafe(activePlayer.color, nextStep);

    // Check for captures on opponents
    bool capturedOpponent = false;
    List<PlayerModel> updatedPlayers = [];

    // Calculate global board coordinate for collision check
    final globalIndex = _calculateGlobalTrackIndex(activePlayer.color, nextStep);

    for (final player in room.players) {
      if (player.color == activePlayer.color) {
        // Update current player's token
        final newTokens = player.tokens.map((t) {
          if (t.id == tokenId) {
            return t.copyWith(
              step: nextStep,
              isSafe: isSafe,
              isFinished: isFinished,
            );
          }
          return t;
        }).toList();

        updatedPlayers.add(player.copyWith(tokens: newTokens));
      } else {
        // Check collision if not safe
        if (!isSafe && globalIndex != null) {
          final newTokens = player.tokens.map((t) {
            if (!t.isInBase && !t.isFinished && !t.isSafe) {
              final oppGlobal = _calculateGlobalTrackIndex(player.color, t.step);
              if (oppGlobal == globalIndex) {
                capturedOpponent = true;
                return t.copyWith(step: -1, isSafe: true); // Reset to base
              }
            }
            return t;
          }).toList();
          updatedPlayers.add(player.copyWith(tokens: newTokens));
        } else {
          updatedPlayers.add(player);
        }
      }
    }

    // Check for win
    final updatedActivePlayer = updatedPlayers.firstWhere((p) => p.color == activePlayer.color);
    final hasWon = updatedActivePlayer.hasWon;

    final bool bonusTurn = (dice == 6) || capturedOpponent || reachedHome;
    final PlayerColor nextTurnColor = (bonusTurn && !hasWon)
        ? room.currentTurnColor
        : _getNextTurnColor(room.players, room.currentTurnColor);

    final updatedRoom = room.copyWith(
      status: hasWon ? RoomStatus.finished : RoomStatus.playing,
      winnerId: hasWon ? activePlayer.uid : null,
      players: updatedPlayers,
      currentTurnColor: nextTurnColor,
      hasRolledDice: false,
      turnTimeRemaining: AppConstants.turnTimeoutSeconds,
    );

    return MoveResult(
      isValid: true,
      updatedRoom: updatedRoom,
      wasCapture: capturedOpponent,
      reachedHome: reachedHome,
      grantsBonusTurn: bonusTurn,
    );
  }

  static bool _isPositionSafe(PlayerColor color, int step) {
    if (step == 0) return true; // Start position is always safe
    if (step >= 51) return true; // Home alley is strictly safe
    final globalIdx = _calculateGlobalTrackIndex(color, step);
    if (globalIdx != null && AppConstants.safeCellIndices.contains(globalIdx)) {
      return true;
    }
    return false;
  }

  static int? _calculateGlobalTrackIndex(PlayerColor color, int step) {
    if (step < 0 || step > 50) return null; // In base or home alley
    final startIdx = AppConstants.startStepIndex[color]!;
    return (startIdx + step) % 52;
  }

  static PlayerColor _getNextTurnColor(List<PlayerModel> players, PlayerColor current) {
    final order = [PlayerColor.red, PlayerColor.green, PlayerColor.yellow, PlayerColor.blue];
    int currentIdx = order.indexOf(current);
    for (int i = 1; i <= 4; i++) {
      final nextColor = order[(currentIdx + i) % 4];
      if (players.any((p) => p.color == nextColor && !p.hasWon)) {
        return nextColor;
      }
    }
    return current;
  }
}
