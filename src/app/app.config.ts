import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE, FIREBASE_STORAGE } from './core/firebase.tokens';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

const firebaseApp = initializeApp(environment.firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    { provide: FIREBASE_AUTH, useValue: getAuth(firebaseApp) },
    { provide: FIREBASE_FIRESTORE, useValue: getFirestore(firebaseApp) },
    { provide: FIREBASE_STORAGE, useValue: getStorage(firebaseApp) }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
  ],
};
