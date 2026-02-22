import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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

  readonly characters = toSignal(this.characterService.getCharacters(this.state.novelId() ?? ''), {
    initialValue: [] as Character[],
  });

  readonly creating = signal(false);
  readonly editingId = signal<string | null>(null);
  newName = '';
  newRole = '';
  editName = '';
  editRole = '';

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
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async deleteCharacter(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    await this.characterService.delete(id);
  }
}
