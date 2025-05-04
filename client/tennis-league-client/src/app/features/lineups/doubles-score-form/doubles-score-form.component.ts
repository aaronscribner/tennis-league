import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { DoublesMatch, Set, DoublesTeamCombination } from '../../../core/models/match.model';
import { LineupService } from '../../../core/services/lineup.service';

@Component({
  selector: 'app-doubles-score-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule
  ],
  templateUrl: './doubles-score-form.component.html',
  styleUrls: ['./doubles-score-form.component.scss']
})
export class DoublesScoreFormComponent implements OnInit {
  scoreForm!: FormGroup;
  teamANames: string[] = ['Player A1', 'Player A2'];
  teamBNames: string[] = ['Player B1', 'Player B2'];
  combinationIndex: number = 0;
  maxSets: number = 3; // Best of 3 sets is standard for tennis
  combinationName: string = 'Combination 1';
  
  constructor(
    private fb: FormBuilder,
    private lineupService: LineupService,
    public dialogRef: MatDialogRef<DoublesScoreFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      match: DoublesMatch, 
      combination: DoublesTeamCombination,
      combinationIndex: number,
      combinationId: string
    }
  ) {
    this.combinationIndex = data.combinationIndex || 0;
  }

  ngOnInit(): void {
    this.initTeamNames();
    this.initForm();
  }
  
  private initTeamNames(): void {
    if (this.data?.combination) {
      const { teamA, teamB, combinationName } = this.data.combination;
      
      if (combinationName) {
        this.combinationName = combinationName;
      } else {
        this.combinationName = `Combination ${this.combinationIndex + 1}`;
      }
      
      this.teamANames = teamA.map(player => {
        if (typeof player === 'object' && player) {
          return `${player.firstName} ${player.lastName}`;
        }
        return 'Player ' + player.toString().substring(0, 4);
      });
      
      this.teamBNames = teamB.map(player => {
        if (typeof player === 'object' && player) {
          return `${player.firstName} ${player.lastName}`;
        }
        return 'Player ' + player.toString().substring(0, 4);
      });
    }
    
    if (this.data?.match?.maxSets) {
      this.maxSets = this.data.match.maxSets;
    }
  }
  
  private initForm(): void {
    this.scoreForm = this.fb.group({
      sets: this.fb.array([])
    });
    
    // Initialize with existing sets if available
    if (this.data?.combination?.sets && this.data.combination.sets.length > 0) {
      this.data.combination.sets.forEach(set => {
        this.addSet(set);
      });
    } else {
      // Start with one empty set
      this.addSet();
    }
  }
  
  get sets(): FormArray {
    return this.scoreForm.get('sets') as FormArray;
  }
  
  addSet(set?: Set): void {
    if (this.sets.length >= this.maxSets) {
      return;
    }
    
    const setForm = this.fb.group({
      teamAGames: [set ? set.teamAGames : 0, [Validators.required, Validators.min(0), Validators.max(7)]],
      teamBGames: [set ? set.teamBGames : 0, [Validators.required, Validators.min(0), Validators.max(7)]],
      isTiebreak: [set ? set.isTiebreak : false],
      tiebreakScore: [set ? set.tiebreakScore : ''],
      isCompleted: [set ? set.isCompleted : false]
    });
    
    this.sets.push(setForm);
  }
  
  removeSet(index: number): void {
    this.sets.removeAt(index);
  }
  
  getCombinationLabel(): string {
    return this.combinationName;
  }
  
  getTeamALabel(): string {
    return this.teamANames.join(' / ');
  }
  
  getTeamBLabel(): string {
    return this.teamBNames.join(' / ');
  }
  
  onSubmit(): void {
    if (this.scoreForm.valid) {
      const matchId = this.data.match._id;
      const combinationId = this.data.combinationId;
      const setsData = this.scoreForm.get('sets')?.value;
      
      if (matchId && combinationId && setsData) {
        this.lineupService.updateDoublesMatchScore(matchId, combinationId, setsData)
          .subscribe(
            (updatedMatch) => {
              this.dialogRef.close(updatedMatch);
            },
            (error) => {
              console.error('Error updating doubles match score:', error);
            }
          );
      } else {
        this.dialogRef.close({
          sets: this.scoreForm.value.sets
        });
      }
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}
