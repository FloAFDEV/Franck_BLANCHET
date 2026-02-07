
import { Dexie, type Table } from 'dexie';
import { Patient, Session, Practitioner, MediaMetadata, MediaBlob } from './types';

// Use named import { Dexie } from 'dexie' to ensure correct class inheritance and type resolution for Dexie methods.
export class OsteoDB extends Dexie {
  patients!: Table<Patient, number>;
  sessions!: Table<Session, number>;
  profile!: Table<Practitioner, number>;
  media_metadata!: Table<MediaMetadata, number>;
  media_blobs!: Table<MediaBlob, number>;
  thumbnails!: Table<MediaBlob, number>;

  constructor() {
    super('OsteoSuiviDB');
    
    // Initialisation de la structure de la base de données via la méthode version() héritée de Dexie.
    this.version(4).stores({
      patients: '++id, lastName, firstName, gender, photoId',
      sessions: '++id, patientId, date',
      profile: 'id',
      media_metadata: '++id, patientId, sessionId, processedAt',
      media_blobs: 'mediaId',
      thumbnails: 'mediaId'
    });
  }
}

export const db = new OsteoDB();

/**
 * Demande au navigateur de ne pas supprimer les données automatiquement.
 * Important pour Safari qui peut purger après 7 jours d'inactivité.
 */
export async function checkAndRequestPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      return await navigator.storage.persist();
    }
    return isPersisted;
  }
  return false;
}
