export interface InvitationCode {
  _id?: string;
  code: string;
  description?: string;
  email?: string;
  isUsed: boolean;
  createdAt?: Date;
  createdByUserId?: string;
  expiresAt?: Date;
  usedAt?: Date;
  usedByUserId?: string;
  usedByEmail?: string;
}