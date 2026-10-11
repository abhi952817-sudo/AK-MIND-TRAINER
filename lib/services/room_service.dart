import 'dart:async';
import 'dart:math';
import '../core/constants.dart';
import '../models/game_room_model.dart';
import '../models/player_model.dart';

class RoomService {
  static final RoomService _instance = RoomService._internal();
  factory RoomService() => _instance;
  RoomService._internal();

  final _roomStreamController = StreamController<GameRoomModel>.broadcast();
  Stream<GameRoomModel> get roomStream => _roomStreamController.stream;

  GameRoomModel? _currentRoom;
  GameRoomModel? get currentRoom => _currentRoom;

  static String generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final rnd = Random();
    return String.fromCharCodes(
      Iterable.generate(6, (_) => chars.codeUnitAt(rnd.nextInt(chars.length))),
    );
  }

  Future<GameRoomModel> createRoom({
    required String hostUid,
    required String hostName,
    required String avatarUrl,
    int maxPlayers = 4,
  }) async {
    final host = PlayerModel(
      uid: hostUid,
      displayName: hostName,
      avatarUrl: avatarUrl,
      color: PlayerColor.red,
      isHost: true,
      isReady: true,
      isOnline: true,
    );

    final room = GameRoomModel(
      id: 'room_${DateTime.now().millisecondsSinceEpoch}',
      roomCode: generateRoomCode(),
      hostId: hostUid,
      maxPlayers: maxPlayers,
      status: RoomStatus.waiting,
      players: [host],
      currentTurnColor: PlayerColor.red,
    );

    _currentRoom = room;
    _roomStreamController.add(room);
    return room;
  }

  Future<bool> joinRoom({
    required String roomCode,
    required String userUid,
    required String userName,
    required String avatarUrl,
  }) async {
    if (_currentRoom == null || _currentRoom!.roomCode != roomCode) {
      return false;
    }

    if (_currentRoom!.isFull) {
      return false;
    }

    // Determine next available color
    final takenColors = _currentRoom!.players.map((p) => p.color).toSet();
    PlayerColor? assignedColor;
    for (final c in [PlayerColor.green, PlayerColor.yellow, PlayerColor.blue, PlayerColor.red]) {
      if (!takenColors.contains(c)) {
        assignedColor = c;
        break;
      }
    }

    if (assignedColor == null) return false;

    final newPlayer = PlayerModel(
      uid: userUid,
      displayName: userName,
      avatarUrl: avatarUrl,
      color: assignedColor,
      isHost: false,
      isReady: true,
      isOnline: true,
    );

    _currentRoom = _currentRoom!.copyWith(
      players: [..._currentRoom!.players, newPlayer],
    );

    _roomStreamController.add(_currentRoom!);
    return true;
  }

  void leaveRoom(String userUid) {
    if (_currentRoom == null) return;

    final remaining = _currentRoom!.players.where((p) => p.uid != userUid).toList();
    if (remaining.isEmpty) {
      _currentRoom = null;
    } else {
      _currentRoom = _currentRoom!.copyWith(
        players: remaining,
        hostId: remaining.first.uid,
      );
      _roomStreamController.add(_currentRoom!);
    }
  }

  void addBot() {
    if (_currentRoom == null || _currentRoom!.isFull) return;
    final takenColors = _currentRoom!.players.map((p) => p.color).toSet();
    final available = [PlayerColor.green, PlayerColor.yellow, PlayerColor.blue, PlayerColor.red]
        .firstWhere((c) => !takenColors.contains(c));

    final botNames = ['TitanBot', 'LudoMaster AI', 'SpeedyRoll', 'LuckyDice'];
    final bot = PlayerModel(
      uid: 'bot_${DateTime.now().millisecondsSinceEpoch}',
      displayName: botNames[_currentRoom!.players.length % botNames.length],
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      color: available,
      isHost: false,
      isReady: true,
      isOnline: true,
      isBot: true,
    );

    _currentRoom = _currentRoom!.copyWith(
      players: [..._currentRoom!.players, bot],
    );
    _roomStreamController.add(_currentRoom!);
  }

  void startGame() {
    if (_currentRoom == null) return;
    _currentRoom = _currentRoom!.copyWith(
      status: RoomStatus.playing,
      currentTurnColor: _currentRoom!.players.first.color,
      hasRolledDice: false,
      turnTimeRemaining: AppConstants.turnTimeoutSeconds,
    );
    _roomStreamController.add(_currentRoom!);
  }

  void updateState(GameRoomModel updated) {
    _currentRoom = updated;
    _roomStreamController.add(updated);
  }

  void dispose() {
    _roomStreamController.close();
  }
}
