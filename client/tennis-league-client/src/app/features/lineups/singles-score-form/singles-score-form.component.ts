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
import { SinglesMatch, SinglesSet, Game } from '../../../core/models/match.model';
import { LineupService } from '../../../core/services/lineup.service';

@Component({
  selector: 'app-singles-score-form',
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
  templateUrl: './singles-score-form.component.html',
  styleUrls: ['./singles-score-form.component.scss']
})
export class SinglesScoreFormComponent implements OnInit {
  scoreForm!: FormGroup;
  playerAName: string = 'Player A';
  playerBName: string = 'Player B';
  maxSets: number = 3; // Best of 3 sets is standard for tennis
  
  constructor(
    private fb: FormBuilder,
    private lineupService: LineupService,
    public dialogRef: MatDialogRef<SinglesScoreFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      match: SinglesMatch, 
      playerAName: string, 
      playerBName: string 
    }
  ) {}

  ngOnInit(): void {
    this.initPlayerNames();
    this.initForm();
  }
  
  private initPlayerNames(): void {
    if (this.data?.playerAName) {
      this.playerAName = this.data.playerAName;
    }
    
    if (this.data?.playerBName) {
      this.playerBName = this.data.playerBName;
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
    if (this.data?.match?.sets && this.data.match.sets.length > 0) {
      this.data.match.sets.forEach(set => {
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
  
  addSet(set?: SinglesSet): void {
    if (this.sets.length >= this.maxSets) {
      return;
    }
    
    const setForm = this.fb.group({
      playerAGames: [set ? set.playerAGames : 0, [Validators.required, Validators.min(0), Validators.max(7)]],
      playerBGames: [set ? set.playerBGames : 0, [Validators.required, Validators.min(0), Validators.max(7)]],
      isTiebreak: [set ? set.isTiebreak : false],
      tiebreakScore: [set ? set.tiebreakScore : ''],
      isCompleted: [set ? set.isCompleted : false],
      games: this.fb.array(set && set.games ? set.games.map(game => this.createGameForm(game)) : [])
    });
    
    this.sets.push(setForm);
  }
  
  private createGameForm(game?: Game): FormGroup {
    return this.fb.group({
      playerAScore: [game ? game.playerAScore : 0, [Validators.required, Validators.min(0), Validators.max(4)]],
      playerBScore: [game ? game.playerBScore : 0, [Validators.required, Validators.min(0), Validators.max(4)]],
      isCompleted: [game ? game.isCompleted : false]
    });
  }
  
  getGames(setIndex: number): FormArray {
    return this.sets.at(setIndex).get('games') as FormArray;
  }
  
  addGame(setIndex: number): void {
    const games = this.getGames(setIndex);
    games.push(this.createGameForm());
    
    // Update the total games in the set
    this.updateSetGameTotals(setIndex);
  }
  
  removeGame(setIndex: number, gameIndex: number): void {
    const games = this.getGames(setIndex);
    games.removeAt(gameIndex);
    
    // Update the total games in the set
    this.updateSetGameTotals(setIndex);
  }
  
  updateSetGameTotals(setIndex: number): void {
    const games = this.getGames(setIndex);
    let playerAGames = 0;
    let playerBGames = 0;
    
    for (let i = 0; i < games.length; i++) {
      const game = games.at(i).value;
      if (game.isCompleted) {
        if (game.playerAScore > game.playerBScore) {
          playerAGames++;
        } else if (game.playerBScore > game.playerAScore) {
          playerBGames++;
        }
      }
    }
    
    const setForm = this.sets.at(setIndex);
    setForm.patchValue({
      playerAGames: playerAGames,
      playerBGames: playerBGames
    });
  }
  
  removeSet(index: number): void {
    this.sets.removeAt(index);
  }
  
  onSubmit(): void {
    if (this.scoreForm.valid) {
      const matchId = this.data.match._id;
      const setsData = this.scoreForm.get('sets')?.value;
      
      if (matchId && setsData) {
        this.lineupService.updateSinglesMatchScore(matchId, setsData)
          .subscribe(
            (updatedMatch) => {
              this.dialogRef.close(updatedMatch);
            },
            (error) => {
              console.error('Error updating match score:', error);
            }
          );
      }
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}
