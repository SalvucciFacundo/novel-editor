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

type ChatMode = 'query' | 'agent';

interface AiProvider {
  id: string;
  label: string;
  baseUrl: string;
  models: string[];
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
];

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

  readonly providers = PROVIDERS;
  readonly mode = signal<ChatMode>('query');
  readonly selectedProvider = signal(PROVIDERS[0]);
  readonly selectedModel = signal(PROVIDERS[0].models[0]);
  readonly messages = signal<Message[]>([]);
  readonly loading = signal(false);
  readonly showConfig = signal(false);
  readonly imagePreview = signal<string | null>(null);

  // Config fields
  apiKey = '';
  userInput = '';

  setMode(mode: ChatMode): void {
    this.mode.set(mode);
  }

  selectProvider(id: string): void {
    const provider = PROVIDERS.find((p) => p.id === id)!;
    this.selectedProvider.set(provider);
    this.selectedModel.set(provider.models[0]);
    this.apiKey = '';
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
    if (!this.apiKey && this.selectedProvider().id !== 'ollama') return;

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
    } catch (err) {
      this.messages.update((m) => [
        ...m,
        {
          role: 'assistant',
          content: '⚠ Error al conectar con la IA. Verificá tu API key y conexión.',
        },
      ]);
    } finally {
      this.loading.set(false);
    }
  }

  private buildSystemPrompt(): string {
    const chapter = this.editorState.activeChapter();
    const context = chapter
      ? `Estás ayudando a escribir una novela web. El capítulo actual se llama "${chapter.title}". Texto actual:\n\n${this.editorState.editor?.getText() ?? ''}`
      : 'Estás ayudando a escribir una novela web.';

    if (this.mode() === 'agent') {
      return `${context}\n\nEres un agente de escritura creativa. Podés modificar el texto, sugerir cambios, analizar imágenes y ayudar activamente con la historia. Cuando propongas cambios de texto, preséntalos claramente.`;
    }
    return `${context}\n\nEres un asistente de consulta para escritores. Respondé preguntas sobre la historia, personajes, coherencia narrativa y estilo.`;
  }

  private async callApi(systemPrompt: string, imageBase64: string | null): Promise<string> {
    const provider = this.selectedProvider();
    const model = this.selectedModel();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey || 'ollama'}`,
    });

    const userContent: unknown[] = this.messages()
      .slice(-1)
      .map((m) => {
        if (imageBase64 && m.role === 'user') {
          return [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ];
        }
        return m.content;
      });

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...this.messages()
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content })),
        {
          role: 'user',
          content: imageBase64 ? userContent[0] : this.messages().slice(-1)[0].content,
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    };

    const response = await this.http
      .post<{ choices: { message: { content: string } }[] }>(provider.baseUrl, body, { headers })
      .toPromise();

    return response?.choices[0]?.message?.content ?? 'Sin respuesta.';
  }

  /** Si modo agente: inserta la respuesta en el editor */
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

  private scrollToBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
