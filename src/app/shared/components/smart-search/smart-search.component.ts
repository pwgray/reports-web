import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";

/**
 * Smart search component with autocomplete suggestions.
 * Provides a search input with:
 * - Real-time search term change events
 * - Dropdown suggestions based on input
 * - Clear button for easy reset
 * - Suggestion selection support
 * 
 * Useful for searching through large lists of items with intelligent suggestions.
 */
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
  /** Placeholder text for the search input */
  @Input() placeholder = 'Search...';
  
  /** Array of search suggestions to display */
  @Input() suggestions: SearchSuggestion[] = [];
  
  /** Event emitted when the search term changes */
  @Output() searchChanged = new EventEmitter<string>();
  
  /** Event emitted when a suggestion is selected */
  @Output() suggestionSelected = new EventEmitter<SearchSuggestion>();

  /** Current search term */
  searchTerm = '';

  /**
   * Called when the search input value changes.
   * Emits the searchChanged event with the new search term.
   */
  onSearchChange(): void {
    this.searchChanged.emit(this.searchTerm);
  }

  /**
   * Clears the search input and emits a change event.
   * Resets the search term to an empty string.
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  /**
   * Handles selection of a suggestion from the dropdown.
   * Updates the search term and emits the suggestionSelected event.
   * @param suggestion - The selected suggestion
   */
  selectSuggestion(suggestion: SearchSuggestion): void {
    this.suggestionSelected.emit(suggestion);
    this.searchTerm = suggestion.text;
  }
}

/**
 * Interface for search suggestion items.
 * Represents a single suggestion in the smart search dropdown.
 */
export interface SearchSuggestion {
  /** Display text for the suggestion */
  text: string;
  
  /** Type/category of the suggestion (e.g., 'table', 'field', 'report') */
  type: string;
  
  /** CSS class or icon identifier for the suggestion */
  icon: string;
}