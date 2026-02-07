
import { Dexie, type Table } from 'dexie';
import { Patient, Session, Practitioner, MediaMetadata, MediaBlob } from './types';

// Fix: Use named import for Dexie to ensure proper class inheritance and access to base methods.
export class OsteoDB extends Dexie {
  patients!: Table<Patient, number>;
  sessions!: Table<Session, number>;
  profile!: Table<Practitioner, number>;
  media_metadata!: Table<MediaMetadata, number>;
  media_blobs!: Table<MediaBlob, number>;
  thumbnails!: Table<MediaBlob, number>;

  constructor() {
    super('OsteoSuiviDB');
    
    // Schema v3: Séparation metadata/blobs pour performance
    // Fix: Access version method inherited from the Dexie base class via any cast to resolve property missing errors.
    (this as any).version(3).stores({
      patients: '++id, lastName, firstName, gender, photoId',
      sessions: '++id, patientId, date',
      profile: 'id',
      media_metadata: '++id, patientId, sessionId, processedAt',
      media_blobs: 'mediaId', // Primary key is the ID from metadata
      thumbnails: 'mediaId'
    });
  }

  async resetDatabase() {
    await Promise.all([
      this.patients.clear(),
      this.sessions.clear(),
      this.profile.clear(),
      this.media_metadata.clear(),
      this.media_blobs.clear(),
      this.thumbnails.clear()
    ]);
  }
}

export const db = new OsteoDB();
