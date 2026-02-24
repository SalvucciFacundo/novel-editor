import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private document = inject(DOCUMENT);

  // El evento beforeinstallprompt que guardamos para mostrarlo cuando el user quiera
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal(false);
  readonly isInstalled = signal(false);

  constructor() {
    // Detectar si ya está instalada como PWA
    if (this.document.defaultView?.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
      return;
    }

    this.document.defaultView?.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    this.document.defaultView?.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
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

// Interfaz nativa del browser no incluida en los tipos de TS por defecto
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
