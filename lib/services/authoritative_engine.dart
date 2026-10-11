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

  const MoveResult({
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

  /// Generates a dice value for the current local game.
  ///
  /// Important: this client-side method is not a server-authoritative
  /// multiplayer dice system.
  static int rollAuthoritativeDice() {
    return _secureRandom.nextInt(6) + 1;
  }

  /// Checks whether a token can legally move with the current dice.
  static bool canTokenMove(TokenModel token, int diceValue) {
    if (diceValue < 1 || diceValue > 6) {
      return false;
    }

    if (token.isFinished) {
      return false;
    }

    // A token in the base needs a six to enter the board.
    if (token.isInBase) {
      return diceValue == 6;
    }

    // The current standard board finishes at step 56.
    // Overshooting the finish is not allowed.
    if (token.step < 0 || token.step + diceValue > 56) {
      return false;
    }

    return true;
  }

  /// Returns the IDs of all tokens that can move.
  static List<int> getMovableTokenIds(
    PlayerModel player,
    int diceValue,
  ) {
    return player.tokens
        .where((token) => canTokenMove(token, diceValue))
        .map((token) => token.id)
        .toList();
  }

  /// Executes a move after validating the current game state.
  static MoveResult executeTokenMove({
    required GameRoomModel room,
    required String requestingUserId,
    required int tokenId,
  }) {
    // 1. A match must be active.
    if (room.status != RoomStatus.playing) {
      return const MoveResult(
        isValid: false,
        message: 'Game is not in active state.',
      );
    }

    // 2. It must be the active player's turn.
    final activePlayer = room.activePlayer;

    if (activePlayer == null ||
        activePlayer.uid != requestingUserId) {
      return const MoveResult(
        isValid: false,
        message: 'Not your turn.',
      );
    }

    // 3. The dice must already have been rolled.
    if (!room.hasRolledDice) {
      return const MoveResult(
        isValid: false,
        message: 'Roll the dice first.',
      );
    }

    final int dice = room.diceValue;

    if (dice < 1 || dice > 6) {
      return const MoveResult(
        isValid: false,
        message: 'Invalid dice value.',
      );
    }

    // 4. Special case: -99 means the screen requested an auto-pass.
    //
    // Only allow passing when no token has a legal move.
    // This prevents the previous firstWhere(-99) crash and prevents
    // a player from voluntarily skipping a valid move.
    if (tokenId == -99) {
      final movableTokens = getMovableTokenIds(activePlayer, dice);

      if (movableTokens.isNotEmpty) {
        return const MoveResult(
          isValid: false,
          message: 'A valid move is available.',
        );
      }

      final nextColor = _getNextTurnColor(
        room.players,
        room.currentTurnColor,
      );

      final updatedRoom = room.copyWith(
        currentTurnColor: nextColor,
        hasRolledDice: false,
        turnTimeRemaining: AppConstants.turnTimeoutSeconds,
      );

      return MoveResult(
        isValid: true,
        message: 'Turn passed because no valid move was available.',
        updatedRoom: updatedRoom,
      );
    }

    // 5. Find the requested token safely.
    TokenModel? selectedToken;

    for (final token in activePlayer.tokens) {
      if (token.id == tokenId) {
        selectedToken = token;
        break;
      }
    }

    if (selectedToken == null) {
      return const MoveResult(
        isValid: false,
        message: 'Token not found.',
      );
    }

    if (!canTokenMove(selectedToken, dice)) {
      return const MoveResult(
        isValid: false,
        message: 'Illegal move for this token.',
      );
    }

    // 6. Calculate the new token position.
    final int nextStep = selectedToken.isInBase
        ? 0
        : selectedToken.step + dice;

    final bool reachedHome = nextStep == 56;

    final bool isSafe = _isPositionSafe(
      activePlayer.color,
      nextStep,
    );

    final int? globalIndex = _calculateGlobalTrackIndex(
      activePlayer.color,
      nextStep,
    );

    bool capturedOpponent = false;
    final List<PlayerModel> updatedPlayers = [];

    // 7. Move the selected token and check for captures.
    for (final player in room.players) {
      if (player.uid == activePlayer.uid) {
        final updatedTokens = player.tokens.map((token) {
          if (token.id != tokenId) {
            return token;
          }

          return token.copyWith(
            step: nextStep,
            isSafe: isSafe,
            isFinished: reachedHome,
          );
        }).toList();

        updatedPlayers.add(
          player.copyWith(tokens: updatedTokens),
        );

        continue;
      }

      // Finished tokens, base tokens and safe tokens cannot be captured.
      if (isSafe || globalIndex == null) {
        updatedPlayers.add(player);
        continue;
      }

      final updatedTokens = player.tokens.map((token) {
        if (token.isInBase ||
            token.isFinished ||
            token.isSafe) {
          return token;
        }

        final int? opponentIndex = _calculateGlobalTrackIndex(
          player.color,
          token.step,
        );

        if (opponentIndex == globalIndex) {
          capturedOpponent = true;

          // Captured token returns to its base.
          return token.copyWith(
            step: -1,
            isSafe: true,
            isFinished: false,
          );
        }

        return token;
      }).toList();

      updatedPlayers.add(
        player.copyWith(tokens: updatedTokens),
      );
    }

    // 8. Determine whether the active player has won.
    final updatedActivePlayer = updatedPlayers.firstWhere(
      (player) => player.uid == activePlayer.uid,
    );

    final bool hasWon = updatedActivePlayer.hasWon;

    // 9. Determine whether another turn is awarded.
    final bool bonusTurn =
        dice == 6 || capturedOpponent || reachedHome;

    final PlayerColor nextTurnColor;

    if (bonusTurn && !hasWon) {
      nextTurnColor = room.currentTurnColor;
    } else {
      nextTurnColor = _getNextTurnColor(
        updatedPlayers,
        room.currentTurnColor,
      );
    }

    // 10. Produce the updated game state.
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
      grantsBonusTurn: bonusTurn && !hasWon,
    );
  }

  /// Checks whether a token position is safe on the standard board.
  static bool _isPositionSafe(
    PlayerColor color,
    int step,
  ) {
    // Starting cell and home lane are safe.
    if (step == 0 || step >= 51) {
      return true;
    }

    final globalIndex = _calculateGlobalTrackIndex(
      color,
      step,
    );

    return globalIndex != null &&
        AppConstants.safeCellIndices.contains(globalIndex);
  }

  /// Converts a player's progress into the shared 52-cell track index.
  ///
  /// This calculation is for the existing standard four-colour board.
  /// Larger player-count variants require their own board definitions.
  static int? _calculateGlobalTrackIndex(
    PlayerColor color,
    int step,
  ) {
    if (step < 0 || step > 50) {
      return null;
    }

    final startIndex = AppConstants.startStepIndex[color];

    if (startIndex == null) {
      return null;
    }

    return (startIndex + step) % AppConstants.standardTrackLength;
  }

  /// Selects the next eligible player using the actual room player order.
  ///
  /// This avoids assuming that every colour is occupied.
  /// It does not, by itself, implement 5-, 6-, 9- or 10-player boards.
  static PlayerColor _getNextTurnColor(
    List<PlayerModel> players,
    PlayerColor currentColor,
  ) {
    if (players.isEmpty) {
      return currentColor;
    }

    final currentIndex = players.indexWhere(
      (player) => player.color == currentColor,
    );

    if (currentIndex == -1) {
      final firstEligible = players.where(
        (player) => !player.hasWon,
      );

      return firstEligible.isNotEmpty
          ? firstEligible.first.color
          : players.first.color;
    }

    // Find the next player who has not already won.
    for (int offset = 1; offset <= players.length; offset++) {
      final index = (currentIndex + offset) % players.length;
      final candidate = players[index];

      if (!candidate.hasWon) {
        return candidate.color;
      }
    }

    // All players have finished.
    return currentColor;
  }
}
