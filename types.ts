
export type Gender = 'M' | 'F';
export type Laterality = 'G' | 'D';

export interface Patient {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  familyStatus: string;
  hasChildren: string; // "Non" ou description (ex: "2 enfants")
  profession: string;
  physicalActivity: string;
  isSmoker: boolean;
  contraception?: string; // Pour les femmes
  currentTreatment: string;
  laterality: Laterality;
  gpName: string; // Médecin traitant
  gpCity: string; // Commune du médecin
  
  // Antécédents
  antSurgical: string;
  antTraumaRhuma: string;
  antOphtalmo: string;
  antORL: string;
  antDigestive: string;
  antNotes: string; // Nouvelles notes liées aux antécédents
  
  medicalHistory: string; // Gardé pour compatibilité ou notes globales
  photoId?: number;
  createdAt: number;
}

export interface Session {
  id?: number;
  patientId: number;
  date: string;
  hdlm: string;
  tests: string;
  treatment: string;
  advice: string;
  createdAt: number;
}

export interface MediaMetadata {
  id?: number;
  patientId?: number;
  sessionId?: number;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  version: number;
  processedAt: number;
}

export interface MediaBlob {
  mediaId: number;
  data: Blob;
}

export interface Practitioner {
  id: number;
  firstName: string;
  lastName: string;
  photo?: string;
  themeColor: string; 
  password?: string;
  isDarkMode?: boolean;
  lastExportDate?: number;
  lastExportRecordCount?: number;
}

export type View = 'DASHBOARD' | 'ADD_PATIENT' | 'EDIT_PATIENT' | 'PATIENT_DETAIL' | 'PRACTITIONER_PROFILE' | 'LOGIN';
