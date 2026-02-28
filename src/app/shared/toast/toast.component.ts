import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="alert">
          <span class="toast__icon" aria-hidden="true">{{ icons[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            (click)="toastService.remove(toast.id)"
            aria-label="Cerrar notificación"
            type="button"
          >
            ✕
          </button>
          <div
            class="toast__progress"
            [style.animation-duration]="toast.duration + 'ms'"
            aria-hidden="true"
          ></div>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  readonly icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
}
