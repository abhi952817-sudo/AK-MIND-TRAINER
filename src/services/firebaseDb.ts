// src/services/firebaseDb.ts
// Centralized Firestore client configured with the app's specific Firestore database ID

import { getFirestore } from 'firebase/firestore';
import { app } from './firebaseAuth';
import config from '../../firebase-applet-config.json';

// Initialize Firestore targeting the specific provisioned database
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export { app };
