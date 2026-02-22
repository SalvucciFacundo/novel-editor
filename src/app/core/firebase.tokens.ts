import { InjectionToken } from '@angular/core';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

/** Token de inyección para Firebase Auth (SDK nativo) */
export const FIREBASE_AUTH = new InjectionToken<Auth>('firebase.auth');

/** Token de inyección para Firestore (SDK nativo) */
export const FIREBASE_FIRESTORE = new InjectionToken<Firestore>('firebase.firestore');

/** Token de inyección para Firebase Storage (SDK nativo) */
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('firebase.storage');
