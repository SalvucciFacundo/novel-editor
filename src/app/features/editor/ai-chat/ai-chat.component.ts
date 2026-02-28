import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EditorStateService } from '../../../core/services/editor-state.service';
import { ChapterService } from '../../../core/services/chapter.service';
import { Chapter } from '../../../models/chapter.model';

type ChatMode = 'query' | 'agent';
type PromptPreset = 'literario' | 'agente' | 'corrector' | 'personalizado';

interface AiProvider {
  id: string;
  label: string;
  baseUrl: string;
  models: string[];
  customUrl?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string;
}

const PROVIDERS: AiProvider[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    models: ['llama3.2', 'llama3.1', 'mistral', 'deepseek-r1'],
  },
  {
    id: 'custom',
    label: 'Custom / Colab',
    baseUrl: '',
    models: ['custom-model'],
    customUrl: true,
  },
];

const PROMPT_PRESETS: Record<PromptPreset, string> = {
  literario: `Eres un asistente literario especializado en escritura creativa de novelas. Tu rol es:
- Ayudar a desarrollar personajes con profundidad psicológica y motivaciones creíbles
- Sugerir giros narrativos, subtramas y arcos de personaje coherentes
- Mantener el tono, voz y estilo de la historia ya establecida
- Señalar inconsistencias de trama, cronología o caracterización
- Proponer descripciones vívidas, diálogos naturales y escenas con tensión dramática
- Recomendar técnicas narrativas (punto de vista, foreshadowing, in media res, etc.)
- Responder siempre en el idioma del escritor (español por defecto)

Mantené las respuestas concretas, útiles y orientadas a la escritura.`,

  agente: `Eres un agente de escritura activo. Podés modificar texto, reescribir fragmentos, continuar escenas y proponer versiones alternativas de párrafos.
Cuando el escritor te pida cambiar algo, devolvé el texto modificado directamente sin explicaciones innecesarias (a menos que se pida).
Mantené siempre el estilo, voz y tono del texto original. Si no hay instrucción de estilo, preferí prosa clara y literaria.
Si proponés cambios significativos, presentá primero la versión nueva y luego una breve justificación de los cambios.`,

  corrector: `Eres un editor y corrector literario experto. Tu función es:
- Corregir ortografía, gramática y puntuación
- Mejorar la fluidez y cohesión del texto sin cambiar la voz del autor
- Identificar repeticiones de palabras o frases
- Señalar párrafos que rompen el ritmo o la coherencia
- Sugerir sinónimos cuando sea apropiado
- Revisar que los diálogos tengan formato correcto
Presentá los errores de forma clara y justificá cada corrección sugerida.`,

  personalizado: '',
};

@Component({
  selector: 'app-ai-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent {
  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly close = output<void>();

  private http = inject(HttpClient);
  private editorState = inject(EditorStateService);
  private chapterService = inject(ChapterService);

  readonly providers = PROVIDERS;
  readonly promptPresetsKeys: PromptPreset[] = [
    'literario',
    'agente',
    'corrector',
    'personalizado',
  ];
  readonly promptPresetLabels: Record<PromptPreset, string> = {
    literario: '📖 Literario',
    agente: '🤖 Agente',
    corrector: '✏ Corrector',
    personalizado: '⚙ Personalizado',
  };
  readonly mode = signal<ChatMode>('query');
  readonly selectedProvider = signal(PROVIDERS[0]);
  readonly selectedModel = signal(PROVIDERS[0].models[0]);
  readonly messages = signal<Message[]>([]);
  readonly loading = signal(false);
  readonly showConfig = signal(false);
  readonly imagePreview = signal<string | null>(null);
  readonly promptPreset = signal<PromptPreset>('literario');
  /** Incluir el contenido completo de todos los capítulos en el contexto */
  readonly includeAllChapters = signal(false);
  /** true mientras se cargan los contenidos de capítulos */
  readonly loadingChapters = signal(false);
  /** Capítulos con contenido completo, cargados al activar el toggle */
  private chaptersFullContent = signal<Chapter[]>([]);

  // Config fields
  apiKey = '';
  userInput = '';
  customUrl = '';
  customModel = 'local-model';
  customSystemPrompt = '';

  setMode(mode: ChatMode): void {
    this.mode.set(mode);
    if (mode === 'agent' && this.promptPreset() === 'literario') {
      this.promptPreset.set('agente');
    } else if (mode === 'query' && this.promptPreset() === 'agente') {
      this.promptPreset.set('literario');
    }
  }

  selectProvider(id: string): void {
    const provider = PROVIDERS.find((p) => p.id === id)!;
    this.selectedProvider.set(provider);
    this.selectedModel.set(provider.models[0]);
    this.apiKey = '';
  }

  getEffectiveUrl(): string {
    const p = this.selectedProvider();
    if (p.customUrl) return this.customUrl.trim();
    return p.baseUrl;
  }

  getEffectiveModel(): string {
    const p = this.selectedProvider();
    if (p.customUrl) return this.customModel.trim() || 'local-model';
    return this.selectedModel();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  async sendMessage(): Promise<void> {
    const content = this.userInput.trim();
    if (!content && !this.imagePreview()) return;

    const isCustom = this.selectedProvider().customUrl;
    const needsKey = !isCustom && this.selectedProvider().id !== 'ollama';
    if (needsKey && !this.apiKey) return;
    if (isCustom && !this.customUrl.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content,
      imageBase64: this.imagePreview() ?? undefined,
    };

    this.messages.update((m) => [...m, userMsg]);
    this.userInput = '';
    const img = this.imagePreview();
    this.imagePreview.set(null);
    this.loading.set(true);

    setTimeout(() => this.scrollToBottom(), 50);

    try {
      const systemPrompt = this.buildSystemPrompt();
      const response = await this.callApi(systemPrompt, img);
      this.messages.update((m) => [...m, { role: 'assistant', content: response }]);
      setTimeout(() => this.scrollToBottom(), 50);
    } catch {
      this.messages.update((m) => [
        ...m,
        {
          role: 'assistant',
          content: '⚠ Error al conectar con la IA. Verificá la URL, el modelo y tu conexión.',
        },
      ]);
    } finally {
      this.loading.set(false);
    }
  }

  private buildSystemPrompt(): string {
    const novel = this.editorState.novel();
    const chapter = this.editorState.activeChapter();
    const allChapters = this.editorState.allChapters();
    const characters = this.editorState.characters();
    const chapterText = this.editorState.editor?.getText({ blockSeparator: '\n' }) ?? '';

    // Bloque de novela (siempre incluido si hay datos)
    const novelBlock = novel
      ? `\n\n--- NOVELA ---\nTítulo: "${novel.title}"${
          novel.description ? `\nSinopsis: ${novel.description}` : ''
        }${novel.tags?.length ? `\nGéneros: ${novel.tags.join(', ')}` : ''}\n---`
      : '';

    // Bloque de personajes (siempre incluido si existen)
    const charsBlock = characters.length
      ? `\n\n--- PERSONAJES ---\n${characters
          .map(
            (c) =>
              `- ${c.name}${c.role ? ` (${c.role})` : ''}${
                c.description ? `: ${c.description.slice(0, 150)}` : ''
              }`,
          )
          .join('\n')}\n---`
      : '';

    // Lista de títulos de capítulos (siempre incluida si existen)
    const chapListBlock = allChapters.length
      ? `\n\n--- CAPÍTULOS ---\n${allChapters
          .map((c, i) => `${i + 1}. ${c.title}${c.id === chapter?.id ? ' ← ACTUAL' : ''}`)
          .join('\n')}\n---`
      : '';

    // Contenido completo de capítulos anteriores (solo si el toggle está activo)
    const prevChapters = this.chaptersFullContent().filter((c) => c.id !== chapter?.id);
    const fullChaptersBlock =
      this.includeAllChapters() && prevChapters.length
        ? `\n\n--- CONTENIDO DE CAPÍTULOS ANTERIORES ---\n${prevChapters
            .map((c) => {
              const text = (c.content ?? '').replace(/<[^>]*>/g, '').trim();
              return text
                ? `### ${c.title}\n${text.slice(0, 1500)}${text.length > 1500 ? '\n[... truncado ...]' : ''}`
                : `### ${c.title}\n[Sin contenido]`;
            })
            .join('\n\n')}\n---`
        : '';

    // Capítulo activo con texto completo
    const activeChapterBlock = chapter
      ? `\n\n--- CAPÍTULO ACTIVO: "${chapter.title}" ---\n${chapterText.slice(0, 3000)}${
          chapterText.length > 3000 ? '\n[... texto truncado ...]' : ''
        }\n---`
      : '';

    const preset = this.promptPreset();
    const basePrompt =
      preset === 'personalizado'
        ? this.customSystemPrompt.trim() || PROMPT_PRESETS.literario
        : PROMPT_PRESETS[preset];

    return `${basePrompt}${novelBlock}${charsBlock}${chapListBlock}${fullChaptersBlock}${activeChapterBlock}`;
  }

  private async callApi(systemPrompt: string, imageBase64: string | null): Promise<string> {
    const url = this.getEffectiveUrl();
    const model = this.getEffectiveModel();
    const isCustom = this.selectedProvider().customUrl;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey || (isCustom ? 'none' : 'ollama')}`,
    });

    const lastUserMsg = this.messages().slice(-1)[0];
    const userContent: unknown = imageBase64
      ? [
          { type: 'text', text: lastUserMsg.content },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ]
      : lastUserMsg.content;

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...this.messages()
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userContent },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    };

    const response = await this.http
      .post<{ choices: { message: { content: string } }[] }>(url, body, { headers })
      .toPromise();

    return response?.choices[0]?.message?.content ?? 'Sin respuesta.';
  }

  applyToEditor(content: string): void {
    this.editorState.insertTextAtCursor('\n\n' + content);
  }

  onEnterKey(event: Event): void {
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.messages.set([]);
  }

  async toggleIncludeChapters(): Promise<void> {
    const enabling = !this.includeAllChapters();
    this.includeAllChapters.set(enabling);
    if (!enabling) {
      this.chaptersFullContent.set([]);
      return;
    }
    const novelId = this.editorState.novelId();
    if (!novelId) return;
    this.loadingChapters.set(true);
    try {
      const chapters = await this.chapterService.getChapters(novelId);
      this.chaptersFullContent.set(chapters);
    } catch {
      this.includeAllChapters.set(false);
    } finally {
      this.loadingChapters.set(false);
    }
  }

  private scrollToBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
