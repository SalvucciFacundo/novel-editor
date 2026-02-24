import { Injectable } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Novel } from '../../models/novel.model';
import { Chapter } from '../../models/chapter.model';
import { Character } from '../../models/character.model';
import { Note } from '../../models/note.model';

/** Crea un objeto compatible con Firestore Timestamp para datos en memoria */
function fakeTs(date: Date = new Date()): Timestamp {
  return {
    toMillis: () => date.getTime(),
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as Timestamp;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const NOVEL_ID = 'demo-novel-1';
const NOW = new Date();
const WEEK_AGO = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000);
const TWO_DAYS_AGO = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);

/** Servicio de almacenamiento en memoria para el modo invitado/demo. */
@Injectable({ providedIn: 'root' })
export class GuestStoreService {
  // ── Novelas ──────────────────────────────────────────────────────────────
  private novels = new Map<string, Novel>([
    [
      NOVEL_ID,
      {
        id: NOVEL_ID,
        title: 'El Último Horizonte',
        description:
          'En el año 2387, la nave Arca-7 parte hacia un sistema estelar desconocido. Lo que la tripulación descubre al llegar cambiará para siempre la comprensión de la humanidad sobre su lugar en el universo.',
        ownerId: 'guest',
        createdAt: fakeTs(WEEK_AGO),
        updatedAt: fakeTs(TWO_DAYS_AGO),
        chapterCount: 3,
        tags: ['ciencia ficción', 'espacio', 'exploración'],
      },
    ],
  ]);

  // ── Capítulos ────────────────────────────────────────────────────────────
  private chapters = new Map<string, Chapter>([
    [
      'demo-ch-1',
      {
        id: 'demo-ch-1',
        novelId: NOVEL_ID,
        title: 'Partida',
        order: 0,
        wordCount: 142,
        createdAt: fakeTs(WEEK_AGO),
        updatedAt: fakeTs(TWO_DAYS_AGO),
        content: `<p>Las luces de la Tierra se desvanecían lentamente a través de las ventanillas de observación. La comandante Elena Voss se negaba a apartar la vista, como si fuera la última vez que vería aquel punto azul brillante suspendido en la oscuridad.</p><p>"Rumbo establecido", anunció la voz inexpresiva del sistema de navegación. "Tiempo estimado de llegada al sistema Kepler-442: diecisiete años, cuatro meses, once días."</p><p>Diecisiete años. El número resonó en la cabina de control con la frialdad de una sentencia. Detrás de Elena, el resto de la tripulación ajustaba sus cinturones de criosueño sin pronunciar palabra. No había nada que decir que no hubiera sido dicho ya.</p><p>Ella fue la última en tumbarse en la cámara de hibernación. Cuando la tapa de cristal se deslizó sobre ella, cerró los ojos y pensó en todo lo que dejaba atrás. En todo lo que esperaba encontrar.</p>`,
      },
    ],
    [
      'demo-ch-2',
      {
        id: 'demo-ch-2',
        novelId: NOVEL_ID,
        title: 'Despertar',
        order: 1,
        wordCount: 118,
        createdAt: fakeTs(WEEK_AGO),
        updatedAt: fakeTs(TWO_DAYS_AGO),
        content: `<p>Una alarma suave perforó el silencio. Elena abrió los ojos con la pesadez de quien ha dormido demasiado, o quizás demasiado poco. La cámara de criosueño se abrió con un siseo de aire frío.</p><p>—Sistema, ¿cuánto tiempo ha pasado? —preguntó con la voz ronca.</p><p>—Diecisiete años, cuatro meses y trece días desde la partida, comandante.</p><p>Se incorporó despacio. A través del visor principal, una estrella naranja pálido brillaba con una intensidad nueva. Y orbitando a su alrededor, apenas visible pero inconfundible, había algo que no debería existir según todos los modelos astrofísicos conocidos: una estructura. Artificial. Enorme.</p><p>Elena no pudo evitar sonreír. Después de todo, el viaje había valido la pena.</p>`,
      },
    ],
    [
      'demo-ch-3',
      {
        id: 'demo-ch-3',
        novelId: NOVEL_ID,
        title: 'El Primer Contacto',
        order: 2,
        wordCount: 97,
        createdAt: fakeTs(TWO_DAYS_AGO),
        updatedAt: fakeTs(new Date(NOW.getTime() - 3 * 60 * 60 * 1000)),
        content: `<p>La señal llegó dieciocho horas después de que establecieran órbita. No era ruido cósmico ni interferencia residual; era un patrón, repetido con una precisión matemática imposible para cualquier fenómeno natural.</p><p>El doctor Rajan Mehta escuchó la grabación tres veces antes de hablar.</p><p>—Es una bienvenida —dijo por fin, con la voz quebrada—. Llevan esperándonos.</p><p>Nadie preguntó cuánto tiempo. Todos pensaron lo mismo: si esa estructura existía desde antes que la humanidad aprendiera a hacer fuego, entonces "esperar" era una palabra que ellos apenas comprendían.</p>`,
      },
    ],
  ]);

  // ── Personajes ───────────────────────────────────────────────────────────
  private characters = new Map<string, Character>([
    [
      'demo-char-1',
      {
        id: 'demo-char-1',
        novelId: NOVEL_ID,
        name: 'Elena Voss',
        role: 'protagonista',
        description:
          'Comandante de la nave Arca-7. Veterana de dos misiones lunares y una expedición a Marte. Cargada con la responsabilidad de dieciocho vidas y el peso de representar a toda la humanidad.',
        traits: ['liderazgo', 'estoica', 'determinada', 'solitaria'],
        createdAt: fakeTs(WEEK_AGO),
      },
    ],
    [
      'demo-char-2',
      {
        id: 'demo-char-2',
        novelId: NOVEL_ID,
        name: 'Rajan Mehta',
        role: 'secundario',
        description:
          'Astrofísico y lingüista de la misión. Optimista empedernido que cree que el universo, en su vastedad, no puede estar vacío de inteligencia. Tiene razón.',
        traits: ['intelectual', 'curioso', 'empático', 'ansioso'],
        createdAt: fakeTs(WEEK_AGO),
      },
    ],
  ]);

  // ── Notas ────────────────────────────────────────────────────────────────
  private notes = new Map<string, Note>([
    [
      'demo-note-1',
      {
        id: 'demo-note-1',
        novelId: NOVEL_ID,
        title: 'La Estructura — Worldbuilding',
        content:
          '<p><strong>La Estructura</strong> es una megaconstrucción de origen desconocido que orbita la estrella Kepler-442b. Sus dimensiones son comparables a las de una luna pequeña.</p><p>Posibles teorías sobre sus constructores:</p><ul><li>Una civilización Tipo III que abandonó el sistema hace millones de años.</li><li>Una IA autopropagante que continúa expandiéndose.</li><li>Algo para lo que la humanidad todavía no tiene concepto.</li></ul><p><em>Nota: la señal de bienvenida sugiere que sabían que vendríamos. ¿Cómo?</em></p>',
        createdAt: fakeTs(WEEK_AGO),
        updatedAt: fakeTs(TWO_DAYS_AGO),
      },
    ],
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // API de novelas
  // ══════════════════════════════════════════════════════════════════════════

  getNovels(): Novel[] {
    return [...this.novels.values()].sort(
      (a, b) =>
        (b.updatedAt as unknown as { toMillis(): number }).toMillis() -
        (a.updatedAt as unknown as { toMillis(): number }).toMillis(),
    );
  }

  createNovel(data: Omit<Novel, 'id' | 'createdAt' | 'updatedAt' | 'chapterCount'>): string {
    const id = genId();
    this.novels.set(id, {
      ...data,
      id,
      chapterCount: 0,
      createdAt: fakeTs(),
      updatedAt: fakeTs(),
    });
    return id;
  }

  updateNovel(id: string, data: Partial<Pick<Novel, 'title' | 'description' | 'tags'>>): void {
    const novel = this.novels.get(id);
    if (novel) this.novels.set(id, { ...novel, ...data, updatedAt: fakeTs() });
  }

  deleteNovel(id: string): void {
    this.novels.delete(id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API de capítulos
  // ══════════════════════════════════════════════════════════════════════════

  getChapters(novelId: string): Chapter[] {
    return [...this.chapters.values()]
      .filter((c) => c.novelId === novelId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  createChapter(data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>): string {
    const id = genId();
    this.chapters.set(id, {
      ...data,
      id,
      content: '',
      wordCount: 0,
      createdAt: fakeTs(),
      updatedAt: fakeTs(),
    });
    // Actualizar chapterCount en la novela
    const novel = this.novels.get(data.novelId);
    if (novel) this.novels.set(novel.id, { ...novel, chapterCount: novel.chapterCount + 1 });
    return id;
  }

  saveChapter(id: string, content: string): void {
    const ch = this.chapters.get(id);
    if (!ch) return;
    const wordCount = content
      .replace(/<[^>]*>/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    this.chapters.set(id, { ...ch, content, wordCount, updatedAt: fakeTs() });
  }

  renameChapter(id: string, title: string): void {
    const ch = this.chapters.get(id);
    if (ch) this.chapters.set(id, { ...ch, title, updatedAt: fakeTs() });
  }

  deleteChapter(id: string): void {
    const ch = this.chapters.get(id);
    if (ch) {
      this.chapters.delete(id);
      const novel = this.novels.get(ch.novelId);
      if (novel)
        this.novels.set(novel.id, { ...novel, chapterCount: Math.max(0, novel.chapterCount - 1) });
    }
  }

  reorderChapters(chapters: { id: string; order: number }[]): void {
    chapters.forEach(({ id, order }) => {
      const ch = this.chapters.get(id);
      if (ch) this.chapters.set(id, { ...ch, order });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API de personajes
  // ══════════════════════════════════════════════════════════════════════════

  getCharacters(novelId: string): Character[] {
    return [...this.characters.values()]
      .filter((c) => c.novelId === novelId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  createCharacter(data: Omit<Character, 'id' | 'createdAt'>): string {
    const id = genId();
    this.characters.set(id, { ...data, id, createdAt: fakeTs() });
    return id;
  }

  updateCharacter(
    id: string,
    data: Partial<Pick<Character, 'name' | 'role' | 'description' | 'traits'>>,
  ): void {
    const ch = this.characters.get(id);
    if (ch) this.characters.set(id, { ...ch, ...data });
  }

  deleteCharacter(id: string): void {
    this.characters.delete(id);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // API de notas
  // ══════════════════════════════════════════════════════════════════════════

  getNotes(novelId: string): Note[] {
    return [...this.notes.values()]
      .filter((n) => n.novelId === novelId)
      .sort(
        (a, b) =>
          (b.updatedAt as unknown as { toMillis(): number }).toMillis() -
          (a.updatedAt as unknown as { toMillis(): number }).toMillis(),
      );
  }

  createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = genId();
    this.notes.set(id, { ...data, id, createdAt: fakeTs(), updatedAt: fakeTs() });
    return id;
  }

  updateNote(id: string, data: Partial<Pick<Note, 'title' | 'content'>>): void {
    const note = this.notes.get(id);
    if (note) this.notes.set(id, { ...note, ...data, updatedAt: fakeTs() });
  }

  deleteNote(id: string): void {
    this.notes.delete(id);
  }
}
