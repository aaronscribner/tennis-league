import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  currentUserId = '';
  editableUsers = new Map<string, User>();
  displayedColumns: string[] = [
    'name',
    'email',
    'skillLevel',
    'role',
    'status',
    'actions'
  ];

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.fetchCurrentUser();
    this.fetchUsers();
  }

  fetchCurrentUser(): void {
    // Access the current user from the signal
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUserId = currentUser._id || '';
    }
  }

  fetchUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.users.forEach(user => {
          // Create a copy of each user for editing
          this.editableUsers.set(user._id || '', {...user});
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching users', error);
        this.snackBar.open('Error loading users. Please try again later.', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  saveUser(userId: string): void {
    const editedUser = this.editableUsers.get(userId);
    if (!editedUser) return;

    this.userService.updateUser(userId, editedUser).subscribe({
      next: (updatedUser) => {
        // Update both the displayed user and the editable copy
        const index = this.users.findIndex(u => u._id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.editableUsers.set(userId, {...updatedUser});
        }
        
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error updating user', error);
        this.snackBar.open('Error updating user. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  toggleUserStatus(userId: string): void {
    const editedUser = this.editableUsers.get(userId);
    if (!editedUser) return;
    
    // Toggle the active status
    editedUser.isActive = !editedUser.isActive;
    
    this.saveUser(userId);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user._id !== userId);
          this.editableUsers.delete(userId);
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting user', error);
          this.snackBar.open('Error deleting user. Please try again.', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  updateUserRole(userId: string, makeCoordinator: boolean): void {
    const newRole = makeCoordinator ? UserRole.COORDINATOR : UserRole.PLAYER;
    const editedUser = this.editableUsers.get(userId);
    
    if (!editedUser) return;
    
    // Update the role in the editable copy
    editedUser.role = newRole;
    
    this.userService.updateUserRole(userId, newRole).subscribe({
      next: (updatedUser) => {
        // Update the displayed user
        const index = this.users.findIndex(u => u._id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.editableUsers.set(userId, {...updatedUser});
        }
        
        this.snackBar.open(
          `User is now a ${newRole === UserRole.COORDINATOR ? 'coordinator' : 'player'}`,
          'Close',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Error updating user role', error);
        this.snackBar.open('Error updating user role. Please try again.', 'Close', {
          duration: 3000
        });
      }
    });
  }

  isCoordinator(user: User): boolean {
    return user.role === UserRole.COORDINATOR || (user.roles?.includes(UserRole.COORDINATOR) || false);
  }

  updateSkillLevel(userId: string, skillLevel: number): void {
    const editedUser = this.editableUsers.get(userId);
    if (!editedUser) return;
    
    // Ensure skillLevel is within the allowed range (3.00-5.00)
    if (skillLevel < 3.00) skillLevel = 3.00;
    if (skillLevel > 5.00) skillLevel = 5.00;
    
    // Round to 2 decimal places
    skillLevel = parseFloat(skillLevel.toFixed(2));
    
    // Update the skill level in the editable copy
    editedUser.skillLevel = skillLevel;
  }

  getUserFullName(user: User): string {
    if (user.displayOnlyNickname && user.nickname) {
      return user.nickname;
    }
    return `${user.firstName} ${user.lastName}`;
  }
}
