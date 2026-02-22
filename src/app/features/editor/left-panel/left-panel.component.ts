import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ChaptersTabComponent } from './chapters-tab/chapters-tab.component';
import { CharactersTabComponent } from './characters-tab/characters-tab.component';
import { NotesTabComponent } from './notes-tab/notes-tab.component';

type Tab = 'chapters' | 'characters' | 'notes';

@Component({
  selector: 'app-left-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChaptersTabComponent, CharactersTabComponent, NotesTabComponent],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss',
})
export class LeftPanelComponent {
  readonly activeTab = signal<Tab>('chapters');

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
