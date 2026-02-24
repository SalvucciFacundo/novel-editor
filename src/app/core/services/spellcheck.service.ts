import { effect, Injectable, signal } from '@angular/core';

export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
];

@Injectable({ providedIn: 'root' })
export class SpellcheckService {
  readonly language = signal<string>(localStorage.getItem('spellcheck-lang') ?? 'es');

  readonly languages = LANGUAGES;

  constructor() {
    effect(() => {
      localStorage.setItem('spellcheck-lang', this.language());
    });
  }

  setLanguage(lang: string): void {
    this.language.set(lang);
  }
}
