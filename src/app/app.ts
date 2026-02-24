import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoBannerComponent } from './shared/components/demo-banner/demo-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DemoBannerComponent],
  template: `
    <router-outlet />
    <app-demo-banner />
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
