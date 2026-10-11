import 'constants.dart';

class GridPoint {
  final int r;
  final int c;
  const GridPoint(this.r, this.c);

  @override
  String toString() => '($r, $c)';
}

class BoardCoordinates {
  // Standard 52 common perimeter tracks (row, col) on a 15x15 grid
  static const List<GridPoint> commonTrack = [
    // Red quadrant exit to bottom track
    GridPoint(6, 1),  // 0 - Red start (safe)
    GridPoint(6, 2),  // 1
    GridPoint(6, 3),  // 2
    GridPoint(6, 4),  // 3
    GridPoint(6, 5),  // 4
    GridPoint(5, 6),  // 5
    GridPoint(4, 6),  // 6
    GridPoint(3, 6),  // 7
    GridPoint(2, 6),  // 8 - Safe cell (star)
    GridPoint(1, 6),  // 9
    GridPoint(0, 6),  // 10
    GridPoint(0, 7),  // 11
    GridPoint(0, 8),  // 12

    // Green track entry
    GridPoint(1, 8),  // 13 - Green start (safe)
    GridPoint(2, 8),  // 14
    GridPoint(3, 8),  // 15
    GridPoint(4, 8),  // 16
    GridPoint(5, 8),  // 17
    GridPoint(6, 9),  // 18
    GridPoint(6, 10), // 19
    GridPoint(6, 11), // 20
    GridPoint(6, 12), // 21 - Safe cell (star)
    GridPoint(6, 13), // 22
    GridPoint(6, 14), // 23
    GridPoint(7, 14), // 24
    GridPoint(8, 14), // 25

    // Yellow track entry
    GridPoint(8, 13), // 26 - Yellow start (safe)
    GridPoint(8, 12), // 27
    GridPoint(8, 11), // 28
    GridPoint(8, 10), // 29
    GridPoint(8, 9),  // 30
    GridPoint(9, 8),  // 31
    GridPoint(10, 8), // 32
    GridPoint(11, 8), // 33
    GridPoint(12, 8), // 34 - Safe cell (star)
    GridPoint(13, 8), // 35
    GridPoint(14, 8), // 36
    GridPoint(14, 7), // 37
    GridPoint(14, 6), // 38

    // Blue track entry
    GridPoint(13, 6), // 39 - Blue start (safe)
    GridPoint(12, 6), // 40
    GridPoint(11, 6), // 41
    GridPoint(10, 6), // 42
    GridPoint(9, 6),  // 43
    GridPoint(8, 5),  // 44
    GridPoint(8, 4),  // 45
    GridPoint(8, 3),  // 46
    GridPoint(8, 2),  // 47 - Safe cell (star)
    GridPoint(8, 1),  // 48
    GridPoint(8, 0),  // 49
    GridPoint(7, 0),  // 50
    GridPoint(6, 0),  // 51
  ];

  // Home columns for each player (5 steps + center triangle)
  static const Map<PlayerColor, List<GridPoint>> homeColumns = {
    PlayerColor.red: [
      GridPoint(7, 1),
      GridPoint(7, 2),
      GridPoint(7, 3),
      GridPoint(7, 4),
      GridPoint(7, 5),
      GridPoint(7, 6), // Center goal
    ],
    PlayerColor.green: [
      GridPoint(1, 7),
      GridPoint(2, 7),
      GridPoint(3, 7),
      GridPoint(4, 7),
      GridPoint(5, 7),
      GridPoint(6, 7), // Center goal
    ],
    PlayerColor.yellow: [
      GridPoint(7, 13),
      GridPoint(7, 12),
      GridPoint(7, 11),
      GridPoint(7, 10),
      GridPoint(7, 9),
      GridPoint(7, 8), // Center goal
    ],
    PlayerColor.blue: [
      GridPoint(13, 7),
      GridPoint(12, 7),
      GridPoint(11, 7),
      GridPoint(10, 7),
      GridPoint(9, 7),
      GridPoint(8, 7), // Center goal
    ],
  };

  // Base positions for 4 tokens in each player's nest
  static const Map<PlayerColor, List<GridPoint>> basePositions = {
    PlayerColor.red: [
      GridPoint(2, 2),
      GridPoint(2, 3),
      GridPoint(3, 2),
      GridPoint(3, 3),
    ],
    PlayerColor.green: [
      GridPoint(2, 11),
      GridPoint(2, 12),
      GridPoint(3, 11),
      GridPoint(3, 12),
    ],
    PlayerColor.yellow: [
      GridPoint(11, 11),
      GridPoint(11, 12),
      GridPoint(12, 11),
      GridPoint(12, 12),
    ],
    PlayerColor.blue: [
      GridPoint(11, 2),
      GridPoint(11, 3),
      GridPoint(12, 2),
      GridPoint(12, 3),
    ],
  };
}
