import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../firebase.tokens';
import { Character, CharacterCreate } from '../../models/character.model';
import { AuthService } from './auth.service';
import { GuestStoreService } from './guest-store.service';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private firestore = inject(FIREBASE_FIRESTORE);
  private authService = inject(AuthService);
  private guestStore = inject(GuestStoreService);

  private clean<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
  }

  private charactersCol(novelId: string) {
    return collection(this.firestore, 'novels', novelId, 'characters');
  }

  private characterDoc(novelId: string, characterId: string) {
    return doc(this.firestore, 'novels', novelId, 'characters', characterId);
  }

  async getCharacters(novelId: string): Promise<Character[]> {
    if (this.authService.isGuest()) return this.guestStore.getCharacters(novelId);
    const snapshot = await getDocs(this.charactersCol(novelId));
    const characters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Character);
    return characters.sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(data: CharacterCreate): Promise<string> {
    if (this.authService.isGuest()) return this.guestStore.createCharacter(data);
    const ref = await addDoc(this.charactersCol(data.novelId), {
      ...this.clean(data),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(
    novelId: string,
    id: string,
    data: Partial<Pick<Character, 'name' | 'role' | 'description' | 'traits'>>,
  ): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.updateCharacter(id, data);
      return;
    }
    await updateDoc(this.characterDoc(novelId, id), this.clean(data));
  }

  async delete(novelId: string, id: string): Promise<void> {
    if (this.authService.isGuest()) {
      this.guestStore.deleteCharacter(id);
      return;
    }
    await deleteDoc(this.characterDoc(novelId, id));
  }
}
