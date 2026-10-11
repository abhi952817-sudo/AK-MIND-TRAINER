import '../core/constants.dart';
import 'player_model.dart';

enum RoomStatus { waiting, playing, finished }

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

  PlayerModel? get activePlayer {
    try {
      return players.firstWhere((p) => p.color == currentTurnColor);
    } catch (_) {
      return players.isNotEmpty ? players.first : null;
    }
  }

  bool get isFull => players.length >= maxPlayers;

  GameRoomModel copyWith({
    RoomStatus? status,
    List<PlayerModel>? players,
    PlayerColor? currentTurnColor,
    int? diceValue,
    bool? hasRolledDice,
    int? turnTimeRemaining,
    String? winnerId,
  }) {
    return GameRoomModel(
      id: id,
      roomCode: roomCode,
      hostId: hostId,
      maxPlayers: maxPlayers,
      status: status ?? this.status,
      players: players ?? this.players,
      currentTurnColor: currentTurnColor ?? this.currentTurnColor,
      diceValue: diceValue ?? this.diceValue,
      hasRolledDice: hasRolledDice ?? this.hasRolledDice,
      turnTimeRemaining: turnTimeRemaining ?? this.turnTimeRemaining,
      winnerId: winnerId ?? this.winnerId,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomCode': roomCode,
    'hostId': hostId,
    'maxPlayers': maxPlayers,
    'status': status.name,
    'players': players.map((p) => p.toJson()).toList(),
    'currentTurnColor': currentTurnColor.name,
    'diceValue': diceValue,
    'hasRolledDice': hasRolledDice,
    'turnTimeRemaining': turnTimeRemaining,
    'winnerId': winnerId,
    'createdAt': createdAt.toIso8601String(),
  };

  factory GameRoomModel.fromJson(Map<String, dynamic> json) {
    return GameRoomModel(
      id: json['id'] as String,
      roomCode: json['roomCode'] as String,
      hostId: json['hostId'] as String,
      maxPlayers: json['maxPlayers'] as int? ?? 4,
      status: RoomStatus.values.byName(json['status'] as String? ?? 'waiting'),
      players: (json['players'] as List<dynamic>?)
          ?.map((e) => PlayerModel.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      currentTurnColor: PlayerColor.values.byName(json['currentTurnColor'] as String? ?? 'red'),
      diceValue: json['diceValue'] as int? ?? 6,
      hasRolledDice: json['hasRolledDice'] as bool? ?? false,
      turnTimeRemaining: json['turnTimeRemaining'] as int? ?? 15,
      winnerId: json['winnerId'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
    );
  }
}
