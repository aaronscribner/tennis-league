import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvitationCodeService } from '../../../core/services/invitation-code.service';
import { SharedModule } from '../../../shared/shared.module';
import { InvitationCode } from '../../../core/models/invitation-code.model';

@Component({
  selector: 'app-invitation-codes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './invitation-codes.component.html',
  styleUrls: ['./invitation-codes.component.scss']
})
export class InvitationCodesComponent implements OnInit {
  invitationCodes: InvitationCode[] = [];
  loading = true;
  codeForm: FormGroup;
  displayedColumns: string[] = ['code', 'description', 'email', 'expiresAt', 'isUsed', 'usedByEmail', 'actions'];
  
  constructor(
    private invitationCodeService: InvitationCodeService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.codeForm = this.fb.group({
      code: ['', [Validators.minLength(4), Validators.maxLength(20)]],
      description: [''],
      email: ['', [Validators.email]],
      expiresAt: ['']
    });
  }

  ngOnInit(): void {
    this.loadCodes();
  }

  loadCodes(): void {
    this.loading = true;
    this.invitationCodeService.getAllCodes().subscribe({
      next: (codes) => {
        this.invitationCodes = codes;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading invitation codes', err);
        this.snackBar.open('Error loading invitation codes', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  createCode(): void {
    if (this.codeForm.invalid) {
      return;
    }
    
    const newCode: Partial<InvitationCode> = {
      ...this.codeForm.value
    };
    
    // If code is empty, let the backend generate one
    if (!newCode.code) {
      delete newCode.code;
    }
    
    this.invitationCodeService.createCode(newCode).subscribe({
      next: (code) => {
        this.invitationCodes.unshift(code);
        this.snackBar.open('Invitation code created successfully', 'Close', { duration: 3000 });
        this.codeForm.reset();
      },
      error: (err) => {
        console.error('Error creating invitation code', err);
        this.snackBar.open('Error creating invitation code', 'Close', { duration: 3000 });
      }
    });
  }

  deleteCode(id: string): void {
    if (confirm('Are you sure you want to delete this invitation code?')) {
      this.invitationCodeService.deleteCode(id).subscribe({
        next: () => {
          this.invitationCodes = this.invitationCodes.filter(code => code._id !== id);
          this.snackBar.open('Invitation code deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error('Error deleting invitation code', err);
          this.snackBar.open('Error deleting invitation code', 'Close', { duration: 3000 });
        }
      });
    }
  }

  generateRandomCode(): void {
    const randomCode = this.invitationCodeService.generateRandomCode(8);
    this.codeForm.get('code')?.setValue(randomCode);
  }

  copyToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open('Invitation code copied to clipboard', 'Close', { duration: 2000 });
    });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
}
