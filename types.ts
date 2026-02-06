
export type Gender = 'M' | 'F';

export interface Patient {
  id?: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  email: string;
  profession: string;
  medicalHistory: string;
  photoId?: number; // Référence vers media_metadata
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
  mediaId: number; // Clé primaire manuelle (liée à MediaMetadata.id)
  data: Blob;
}

export interface Practitioner {
  id: number;
  firstName: string;
  lastName: string;
  photo?: string; // Gardé en base64 car très petit (favicon/profile)
  themeColor: string; 
  password?: string;
  isDarkMode?: boolean;
}

export type View = 'DASHBOARD' | 'ADD_PATIENT' | 'EDIT_PATIENT' | 'PATIENT_DETAIL' | 'PRACTITIONER_PROFILE' | 'LOGIN';
