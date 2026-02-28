import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../../../core/services/character.service';
import { EditorStateService } from '../../../../core/services/editor-state.service';
import { ToastService } from '../../../../core/services/toast.service';
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
  private toast = inject(ToastService);

  readonly characters = signal<Character[]>([]);
  readonly creating = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly viewMode = signal<'list' | 'board'>('list');
  newName = '';
  newRole = '';
  editName = '';
  editRole = '';
  editDesc = '';
  editTraits = '';

  /** Colores por rol para la vista tablero */
  roleColor(role?: string): string {
    const r = (role ?? '').toLowerCase();
    if (r.includes('protagonista')) return 'role--blue';
    if (r.includes('antagonista')) return 'role--red';
    if (r.includes('secundario')) return 'role--amber';
    return 'role--default';
  }

  /** Iniciales del personaje para el avatar */
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

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
    } catch {
      this.toast.error('Error al cargar los personajes.');
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
    try {
      await this.characterService.create({
        novelId,
        name: this.newName.trim(),
        role: this.newRole.trim() || undefined,
      });
      this.toast.success('Personaje creado');
    } catch {
      this.toast.error('No se pudo crear el personaje.');
    }
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
    this.editDesc = character.description ?? '';
    this.editTraits = (character.traits ?? []).join(', ');
  }

  async confirmEdit(id: string): Promise<void> {
    if (!this.editName.trim()) return;
    const traits = this.editTraits
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await this.characterService.update(id, {
        name: this.editName.trim(),
        role: this.editRole.trim() || undefined,
        description: this.editDesc.trim() || undefined,
        traits: traits.length ? traits : undefined,
      });
      this.toast.success('Personaje actualizado');
    } catch {
      this.toast.error('No se pudo actualizar el personaje.');
    }
    this.editingId.set(null);
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async deleteCharacter(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    try {
      await this.characterService.delete(id);
      this.toast.success('Personaje eliminado');
    } catch {
      this.toast.error('No se pudo eliminar el personaje.');
    }
    const novelId = this.state.novelId();
    if (novelId) await this.load(novelId);
  }
}
