export interface InvitationCode {
  _id?: string;
  code: string;
  notes?: string;  // Changed from description to notes to match backend schema
  email?: string;
  isUsed: boolean;
  createdAt?: Date;
  createdByUserId?: string;
  expiresAt?: Date;
  usedAt?: Date;
  usedByUserId?: string;
  usedByEmail?: string;
}