import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { UUID } from '../utils/uuid';
import { AuthServiceService } from './auth-service.service';

@Injectable({
  providedIn: 'root',
})
export class StorageApIService {
  constructor(
    private afs: AngularFireStorage,
    private auth: AuthServiceService
  ) {}

  profileImage(uid = this.auth.uid) {
    return this.afs.ref(`userProfile/${uid}`);
  }

  profileImgeUrl(uid = this.auth.uid) {
    try {
      return this.profileImage(uid).getDownloadURL();
    } catch (error) {
      return undefined;
    }
  }

  uploadProfileImage(file: File, uid = this.auth.uid) {
    const ref = this.profileImage(uid);
    const upload = ref.put(file);
    return upload;
  }

  getGalleryImageURL(imageId: string) {
    return this.afs.ref(`images/galleries/${imageId}`).getDownloadURL();
  }

  uploadGalleryImage(uid: string, file: File) {
    const ref = this.afs.ref(`images/galleries/${uid}`);
    const upload = ref.put(file);
    return upload;
  }

  removeGalleryImage(uid: string) {
    const ref = this.afs.ref(`images/galleries/${uid}`);
    const upload = ref.delete();
    return upload;
  }
}
