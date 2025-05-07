import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { InvitationCode } from '../models/invitation-code.model';

@Injectable({
  providedIn: 'root'
})
export class InvitationCodeService {
  private apiUrl = `${environment.apiUrl}/invitation-codes`;

  constructor(private http: HttpClient) {}

  /**
   * Get all invitation codes (admin only)
   */
  getAllCodes(): Observable<InvitationCode[]> {
    return this.http.get<InvitationCode[]>(this.apiUrl);
  }

  /**
   * Get a specific invitation code by ID (admin only)
   */
  getCodeById(id: string): Observable<InvitationCode> {
    return this.http.get<InvitationCode>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new invitation code (admin only)
   */
  createCode(codeData: Partial<InvitationCode>): Observable<InvitationCode> {
    return this.http.post<InvitationCode>(this.apiUrl, codeData);
  }

  /**
   * Update an existing invitation code (admin only)
   */
  updateCode(id: string, codeData: Partial<InvitationCode>): Observable<InvitationCode> {
    return this.http.put<InvitationCode>(`${this.apiUrl}/${id}`, codeData);
  }

  /**
   * Delete an invitation code (admin only)
   */
  deleteCode(id: string): Observable<InvitationCode> {
    return this.http.delete<InvitationCode>(`${this.apiUrl}/${id}`);
  }

  /**
   * Validate an invitation code (public)
   */
  validateCode(code: string, email?: string): Observable<boolean> {
    let url = `${this.apiUrl}/validate/${code}`;
    if (email) {
      url += `?email=${encodeURIComponent(email)}`;
    }
    return this.http.get<{ valid: boolean }>(url).pipe(
      map(response => response.valid)
    );
  }

  /**
   * Mark an invitation code as used
   */
  markCodeAsUsed(code: string, userId: string, email: string): Observable<InvitationCode> {
    return this.http.post<InvitationCode>(`${this.apiUrl}/mark-used`, {
      code,
      userId,
      email
    });
  }

  /**
   * Generate a new random code (frontend helper)
   */
  generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}