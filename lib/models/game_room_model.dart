import '../core/constants.dart';
import 'player_model.dart';

enum RoomStatus {
  waiting,
  playing,
  finished,
}

class GameRoomModel {
  final String id;
  final String roomCode;
  final String hostId;
  final int maxPlayers;
  final RoomStatus status;
  final List<PlayerModel> players;
  final PlayerColor currentTurnColor;
  final int diceValue;
  final bool hasRolledDice;
  final int turnTimeRemaining;
  final String? winnerId;
  final DateTime createdAt;

  GameRoomModel({
    required this.id,
    required this.roomCode,
    required this.hostId,
    this.maxPlayers = 4,
    this.status = RoomStatus.waiting,
    required this.players,
    this.currentTurnColor = PlayerColor.red,
    this.diceValue = 6,
    this.hasRolledDice = false,
    this.turnTimeRemaining = AppConstants.turnTimeoutSeconds,
    this.winnerId,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Returns the player whose colour matches the current turn.
  /// Returns null if that player is not present in the room.
  PlayerModel? get activePlayer {
    for (final player in players) {
      if (player.color == currentTurnColor && !player.hasWon) {
        return player;
      }
    }
    return null;
  }

  bool get isFull => players.length >= maxPlayers;

  bool get canStart =>
      status == RoomStatus.waiting &&
      players.isNotEmpty &&
      players.length <= maxPlayers;

  GameRoomModel copyWith({
    String? hostId,
    int? maxPlayers,
    RoomStatus? status,
    List<PlayerModel>? players,
    PlayerColor? currentTurnColor,
    int? diceValue,
    bool? hasRolledDice,
    int? turnTimeRemaining,
    String? winnerId,
    bool clearWinnerId = false,
  }) {
    return GameRoomModel(
      id: id,
      roomCode: roomCode,
      hostId: hostId ?? this.hostId,
      maxPlayers: maxPlayers ?? this.maxPlayers,
      status: status ?? this.status,
      players: players ?? this.players,
      currentTurnColor: currentTurnColor ?? this.currentTurnColor,
      diceValue: diceValue ?? this.diceValue,
      hasRolledDice: hasRolledDice ?? this.hasRolledDice,
      turnTimeRemaining: turnTimeRemaining ?? this.turnTimeRemaining,
      winnerId: clearWinnerId ? null : (winnerId ?? this.winnerId),
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'roomCode': roomCode,
        'hostId': hostId,
        'maxPlayers': maxPlayers,
        'status': status.name,
        'players': players.map((player) => player.toJson()).toList(),
        'currentTurnColor': currentTurnColor.name,
        'diceValue': diceValue,
        'hasRolledDice': hasRolledDice,
        'turnTimeRemaining': turnTimeRemaining,
        'winnerId': winnerId,
        'createdAt': createdAt.toIso8601String(),
      };

  factory GameRoomModel.fromJson(Map<String, dynamic> json) {
    final statusName = json['status'] as String? ?? 'waiting';
    final colorName = json['currentTurnColor'] as String? ?? 'red';

    return GameRoomModel(
      id: json['id'] as String,
      roomCode: json['roomCode'] as String,
      hostId: json['hostId'] as String,
      maxPlayers: json['maxPlayers'] as int? ?? 4,
      status: RoomStatus.values.firstWhere(
        (value) => value.name == statusName,
        orElse: () => RoomStatus.waiting,
      ),
      players: (json['players'] as List<dynamic>?)
              ?.map(
                (item) => PlayerModel.fromJson(
                  Map<String, dynamic>.from(item as Map),
                ),
              )
              .toList() ??
          <PlayerModel>[],
      currentTurnColor: PlayerColor.values.firstWhere(
        (value) => value.name == colorName,
        orElse: () => PlayerColor.red,
      ),
      diceValue: json['diceValue'] as int? ?? 6,
      hasRolledDice: json['hasRolledDice'] as bool? ?? false,
      turnTimeRemaining: json['turnTimeRemaining'] as int? ??
          AppConstants.turnTimeoutSeconds,
      winnerId: json['winnerId'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }
}
