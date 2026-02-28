import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<Toast[]>([]);

  private show(message: string, type: ToastType, duration: number): void {
    const id = ++this.counter;
    this.toasts.update((t) => [...t, { id, message, type, duration }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(message: string, duration = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  remove(id: number): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
