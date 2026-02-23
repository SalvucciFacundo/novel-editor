import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { NovelService } from '../../core/services/novel.service';
import { ChapterService } from '../../core/services/chapter.service';
import { EditorStateService } from '../../core/services/editor-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LeftPanelComponent } from './left-panel/left-panel.component';
import { TextEditorComponent } from './text-editor/text-editor.component';
import { AiChatComponent } from './ai-chat/ai-chat.component';

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LeftPanelComponent, TextEditorComponent, AiChatComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy {
  readonly novelId = input.required<string>();

  private novelService = inject(NovelService);
  private chapterService = inject(ChapterService);
  readonly editorState = inject(EditorStateService);
  private auth = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly novelTitle = signal('');
  readonly saving = this.editorState.saving;
  readonly hasUnsaved = this.editorState.hasUnsavedChanges;
  readonly activeChapter = this.editorState.activeChapter;

  ngOnInit(): void {
    this.editorState.novelId.set(this.novelId());
    this.loadNovelTitle();
  }

  ngOnDestroy(): void {
    this.editorState.novelId.set(null);
    this.editorState.activeChapter.set(null);
    this.editorState.editor?.destroy();
    this.editorState.editor = null;
  }

  private async loadNovelTitle(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    const novels = await this.novelService.getNovels(uid);
    const novel = novels.find((n) => n.id === this.novelId());
    if (novel) this.novelTitle.set(novel.title);
  }

  async save(): Promise<void> {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.editorState.saving.set(true);
    try {
      await this.chapterService.save(chapter.id, this.editorState.editor.getHTML());
      this.editorState.markSaved();
    } finally {
      this.editorState.saving.set(false);
    }
  }

  exportTxt(): void {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.downloadFile(`${chapter.title}.txt`, this.editorState.editor.getText(), 'text/plain');
  }

  exportHtml(): void {
    const chapter = this.activeChapter();
    if (!chapter || !this.editorState.editor) return;
    this.downloadFile(`${chapter.title}.html`, this.editorState.editor.getHTML(), 'text/html');
  }

  private downloadFile(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
