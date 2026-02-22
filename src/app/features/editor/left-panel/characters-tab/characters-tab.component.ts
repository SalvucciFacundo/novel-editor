import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../../../core/services/character.service';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { Character } from '../../../../models/character.model';

@Component({
  selector: 'app-characters-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './characters-tab.component.html',
  styleUrl: './characters-tab.component.scss',
})
export class CharactersTabComponent {
  private characterService = inject(CharacterService);
  readonly state = inject(EditorStateService);

  readonly characters = signal<Character[]>([]);
  readonly creating = signal(false);
  readonly editingId = signal<string | null>(null);
  newName = '';
  newRole = '';
  editName = '';
  editRole = '';

  constructor() {
    effect(() => {
      const novelId = this.state.novelId();
      if (novelId) this.load(novelId);
      else this.characters.set([]);
    });
  }

  private async load(novelId: string): Promise<void> {
    try {
      const data = await this.characterService.getCharacters(novelId);
      this.characters.set(data);
    } catch (err) {
      console.error('Error cargando personajes:', err);
    }
  }

  /** Inserta el nombre del personaje en el editor en la posición del cursor */
  insertName(name: string): void {
    this.state.insertTextAtCursor(name);
  }

  startCreate(): void {
    this.newName = '';
    this.newRole = '';
    this.creating.set(true);
  }

  async confirmCreate(): Promise<void> {
    if (!this.newName.trim()) return;
    const novelId = this.state.novelId();
    if (!novelId) return;

    await this.characterService.create({
      novelId,
      name: this.newName.trim(),
      role: this.newRole.trim() || undefined,
    });
    this.creating.set(false);
    await this.load(novelId);
  }

  cancelCreate(): void {
    this.creating.set(false);
  }

  startEdit(character: Character): void {
    this.editingId.set(character.id);
    this.editName = character.name;
    this.editRole = character.role ?? '';
  }

  async confirmEdit(id: string): Promise<void> {
    if (!this.editName.trim()) return;
    await this.characterService.update(id, {
      name: this.editName.trim(),
      role: this.editRole.trim() || undefined,
    });
    this.editingId.set(null);
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async deleteCharacter(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    await this.characterService.delete(id);
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }
}
