import '../core/constants.dart';

class TokenModel {
  final int id;
  final PlayerColor color;
  final int step; // -1 = in base, 0..50 = track, 51..56 = home path, 57 = home finished
  final bool isSafe;
  final bool isFinished;

  const TokenModel({
    required this.id,
    required this.color,
    this.step = -1,
    this.isSafe = true,
    this.isFinished = false,
  });

  bool get isInBase => step == -1;

  TokenModel copyWith({
    int? step,
    bool? isSafe,
    bool? isFinished,
  }) {
    return TokenModel(
      id: id,
      color: color,
      step: step ?? this.step,
      isSafe: isSafe ?? this.isSafe,
      isFinished: isFinished ?? this.isFinished,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'color': color.name,
    'step': step,
    'isSafe': isSafe,
    'isFinished': isFinished,
  };

  factory TokenModel.fromJson(Map<String, dynamic> json) {
    return TokenModel(
      id: json['id'] as int,
      color: PlayerColor.values.byName(json['color'] as String),
      step: json['step'] as int,
      isSafe: json['isSafe'] as bool? ?? false,
      isFinished: json['isFinished'] as bool? ?? false,
    );
  }
}

class PlayerModel {
  final String uid;
  final String displayName;
  final String avatarUrl;
  final PlayerColor color;
  final bool isHost;
  final bool isReady;
  final bool isOnline;
  final bool isBot;
  final List<TokenModel> tokens;

  PlayerModel({
    required this.uid,
    required this.displayName,
    required this.avatarUrl,
    required this.color,
    this.isHost = false,
    this.isReady = false,
    this.isOnline = true,
    this.isBot = false,
    List<TokenModel>? tokens,
  }) : tokens = tokens ?? List.generate(4, (i) => TokenModel(id: i, color: color));

  int get finishedTokensCount => tokens.where((t) => t.isFinished).length;
  bool get hasWon => finishedTokensCount == 4;

  PlayerModel copyWith({
    String? displayName,
    String? avatarUrl,
    bool? isHost,
    bool? isReady,
    bool? isOnline,
    bool? isBot,
    List<TokenModel>? tokens,
  }) {
    return PlayerModel(
      uid: uid,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      color: color,
      isHost: isHost ?? this.isHost,
      isReady: isReady ?? this.isReady,
      isOnline: isOnline ?? this.isOnline,
      isBot: isBot ?? this.isBot,
      tokens: tokens ?? this.tokens,
    );
  }

  Map<String, dynamic> toJson() => {
    'uid': uid,
    'displayName': displayName,
    'avatarUrl': avatarUrl,
    'color': color.name,
    'isHost': isHost,
    'isReady': isReady,
    'isOnline': isOnline,
    'isBot': isBot,
    'tokens': tokens.map((t) => t.toJson()).toList(),
  };

  factory PlayerModel.fromJson(Map<String, dynamic> json) {
    final color = PlayerColor.values.byName(json['color'] as String);
    return PlayerModel(
      uid: json['uid'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String? ?? '',
      color: color,
      isHost: json['isHost'] as bool? ?? false,
      isReady: json['isReady'] as bool? ?? false,
      isOnline: json['isOnline'] as bool? ?? true,
      isBot: json['isBot'] as bool? ?? false,
      tokens: (json['tokens'] as List<dynamic>?)
          ?.map((e) => TokenModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
          List.generate(4, (i) => TokenModel(id: i, color: color)),
    );
  }
}
