import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding: 2rem; color: white; background: #0f0f0f; min-height: 100vh;">
      <h1>✦ Editor</h1>
      <p>Editor de capítulo — próximamente</p>
    </main>
  `,
})
export class EditorComponent {}
