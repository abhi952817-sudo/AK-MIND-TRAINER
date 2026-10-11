import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Anonymous guest login with automatic profile document bootstrap
  Future<UserCredential> signInAnonymously({String? customName}) async {
    final cred = await _auth.signInAnonymously();
    final user = cred.user!;
    final name = customName ?? 'Player_${user.uid.substring(0, 5)}';

    await _firestore.collection('users').doc(user.uid).set({
      'uid': user.uid,
      'displayName': name,
      'avatarUrl': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      'coins': 2500,
      'diamonds': 50,
      'winCount': 0,
      'gamesPlayed': 0,
      'isAnonymous': true,
      'createdAt': FieldValue.serverTimestamp(),
      'lastActive': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    return cred;
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
