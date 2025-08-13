import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";

// shared/components/smart-search/smart-search.component.ts
@Component({
  selector: 'app-smart-search',
  imports: [CommonModule,
    FormsModule],
  template: `
    <div class="smart-search">
      <div class="search-input">
        <i class="icon-search"></i>
        <input 
          type="text"
          [(ngModel)]="searchTerm"
          (input)="onSearchChange()"
          [placeholder]="placeholder"
          autocomplete="off">
        <button 
          *ngIf="searchTerm"
          class="clear-btn"
          (click)="clearSearch()">
          <i class="icon-close"></i>
        </button>
      </div>
      
      <div class="search-suggestions" *ngIf="suggestions.length > 0">
        <div 
          *ngFor="let suggestion of suggestions"
          class="suggestion-item"
          (click)="selectSuggestion(suggestion)">
          <i [class]="suggestion.icon"></i>
          <span class="suggestion-text">{{ suggestion.text }}</span>
          <span class="suggestion-type">{{ suggestion.type }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./smart-search.component.scss']
})
export class SmartSearchComponent {
  @Input() placeholder = 'Search...';
  @Input() suggestions: SearchSuggestion[] = [];
  @Output() searchChanged = new EventEmitter<string>();
  @Output() suggestionSelected = new EventEmitter<SearchSuggestion>();

  searchTerm = '';

  onSearchChange(): void {
    this.searchChanged.emit(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.searchTerm = suggestion.text;
  }
}

export interface SearchSuggestion {
  text: string;
  type: string;
  icon: string;
}