import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  readonly theme = signal<Theme>((localStorage.getItem('theme') as Theme | null) ?? 'dark');

  readonly isDark = () => this.theme() === 'dark';

  constructor() {
    effect(() => {
      const t = this.theme();
      this.document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
    });
    // Apply immediately on init
    this.document.documentElement.setAttribute('data-theme', this.theme());
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
