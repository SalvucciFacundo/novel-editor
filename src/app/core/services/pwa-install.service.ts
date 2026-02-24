import { inject, Injectable, NgZone, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

// Tipado de la variable global capturada en index.html
declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private document = inject(DOCUMENT);
  private zone = inject(NgZone);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(false);

  constructor() {
    const win = this.document.defaultView as (Window & typeof globalThis) | null;
    if (!win) return;

    // Si ya está instalada como PWA no mostrar el botón
    if (win.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
      return;
    }

    // Recuperar el evento capturado antes de que Angular cargara
    if (win.__pwaInstallPrompt) {
      this.deferredPrompt = win.__pwaInstallPrompt;
      this.canInstall.set(true);
    }

    // También escuchar por si llega después
    win.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.zone.run(() => this.canInstall.set(true));
    });

    win.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.isInstalled.set(true);
        this.canInstall.set(false);
      });
      this.deferredPrompt = null;
      win.__pwaInstallPrompt = null;
    });
  }

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }
    this.deferredPrompt = null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
