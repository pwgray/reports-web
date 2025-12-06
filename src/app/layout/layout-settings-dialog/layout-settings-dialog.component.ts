import { Component, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faCog, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { LayoutConfiguration } from "../../core/models/report.models";

/**
 * Dialog component for configuring report layout settings.
 * Provides a comprehensive interface for setting:
 * - Page configuration (orientation, size)
 * - Report elements visibility (header, footer, page numbers, grid lines)
 * - Margins and spacing
 * - Font sizes
 * - Advanced options (repeat headers, fit to page, page breaks)
 * 
 * Initializes with default values if not provided and allows reset to defaults.
 */
@Component({
  selector: 'app-layout-settings-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatInputModule,
    FontAwesomeModule
  ],
  template: `
    <div class="layout-settings-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <fa-icon [icon]="faCog"></fa-icon>
          Layout Settings
        </h2>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <fa-icon [icon]="faTimes"></fa-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        <div class="settings-section">
          <h3>Page Configuration</h3>
          
          <div class="setting-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Page Orientation</mat-label>
              <mat-select [(ngModel)]="layout.orientation">
                <mat-option value="portrait">Portrait</mat-option>
                <mat-option value="landscape">Landscape</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="setting-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Page Size</mat-label>
              <mat-select [(ngModel)]="layout.pageSize">
                <mat-option value="A4">A4 (210 × 297 mm)</mat-option>
                <mat-option value="Letter">Letter (8.5 × 11 in)</mat-option>
                <mat-option value="Legal">Legal (8.5 × 14 in)</mat-option>
                <mat-option value="A3">A3 (297 × 420 mm)</mat-option>
                <mat-option value="A5">A5 (148 × 210 mm)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="settings-section">
          <h3>Report Elements</h3>
          
          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.showHeader" class="full-width">
              Show Report Header
            </mat-checkbox>
          </div>

          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.showFooter" class="full-width">
              Show Report Footer
            </mat-checkbox>
          </div>

          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.showPageNumbers" class="full-width">
              Show Page Numbers
            </mat-checkbox>
          </div>

          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.showGridLines" class="full-width">
              Show Grid Lines
            </mat-checkbox>
          </div>
        </div>

        <div class="settings-section">
          <h3>Margins & Spacing</h3>
          
          <div class="setting-row">
            <mat-form-field appearance="outline">
              <mat-label>Top Margin (mm)</mat-label>
              <input matInput type="number" [(ngModel)]="layout.topMargin" min="0" max="50">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Bottom Margin (mm)</mat-label>
              <input matInput type="number" [(ngModel)]="layout.bottomMargin" min="0" max="50">
            </mat-form-field>
          </div>

          <div class="setting-row">
            <mat-form-field appearance="outline">
              <mat-label>Left Margin (mm)</mat-label>
              <input matInput type="number" [(ngModel)]="layout.leftMargin" min="0" max="50">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Right Margin (mm)</mat-label>
              <input matInput type="number" [(ngModel)]="layout.rightMargin" min="0" max="50">
            </mat-form-field>
          </div>
        </div>

        <div class="settings-section">
          <h3>Font Settings</h3>
          
          <div class="setting-row">
            <mat-form-field appearance="outline">
              <mat-label>Header Font Size</mat-label>
              <mat-select [(ngModel)]="layout.headerFontSize">
                <mat-option value="10">10pt</mat-option>
                <mat-option value="12">12pt</mat-option>
                <mat-option value="14">14pt</mat-option>
                <mat-option value="16">16pt</mat-option>
                <mat-option value="18">18pt</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Body Font Size</mat-label>
              <mat-select [(ngModel)]="layout.bodyFontSize">
                <mat-option value="8">8pt</mat-option>
                <mat-option value="10">10pt</mat-option>
                <mat-option value="12">12pt</mat-option>
                <mat-option value="14">14pt</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <div class="settings-section">
          <h3>Advanced Options</h3>
          
          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.repeatHeaderOnEachPage" class="full-width">
              Repeat Header on Each Page
            </mat-checkbox>
          </div>

          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.fitToPage" class="full-width">
              Fit Content to Page Width
            </mat-checkbox>
          </div>

          <div class="setting-row">
            <mat-checkbox [(ngModel)]="layout.allowPageBreak" class="full-width">
              Allow Page Breaks Within Groups
            </mat-checkbox>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          Cancel
        </button>
        <button mat-button (click)="onReset()">
          Reset to Defaults
        </button>
        <button mat-raised-button color="primary" (click)="onSave()">
          <fa-icon [icon]="faSave"></fa-icon>
          Save Settings
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./layout-settings-dialog.component.scss']
})
export class LayoutSettingsDialogComponent {
  /** Current layout configuration being edited */
  layout: LayoutConfiguration = {};

  /** FontAwesome icons */
  faCog = faCog;
  faSave = faSave;
  faTimes = faTimes;

  /**
   * Creates an instance of LayoutSettingsDialogComponent.
   * Initializes layout configuration with provided values or defaults.
   * @param dialogRef - Reference to the Material Dialog for closing
   * @param data - Dialog data containing the current layout configuration
   */
  constructor(
    public dialogRef: MatDialogRef<LayoutSettingsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { layout: LayoutConfiguration }
  ) {
    // Initialize with default values if not provided
    this.layout = {
      orientation: data.layout.orientation || 'portrait',
      pageSize: data.layout.pageSize || 'A4',
      showHeader: data.layout.showHeader !== undefined ? data.layout.showHeader : true,
      showFooter: data.layout.showFooter !== undefined ? data.layout.showFooter : true,
      showPageNumbers: data.layout.showPageNumbers !== undefined ? data.layout.showPageNumbers : true,
      showGridLines: data.layout.showGridLines !== undefined ? data.layout.showGridLines : true,
      topMargin: data.layout.topMargin || 20,
      bottomMargin: data.layout.bottomMargin || 20,
      leftMargin: data.layout.leftMargin || 20,
      rightMargin: data.layout.rightMargin || 20,
      headerFontSize: data.layout.headerFontSize || 14,
      bodyFontSize: data.layout.bodyFontSize || 12,
      repeatHeaderOnEachPage: data.layout.repeatHeaderOnEachPage !== undefined ? data.layout.repeatHeaderOnEachPage : true,
      fitToPage: data.layout.fitToPage !== undefined ? data.layout.fitToPage : true,
      allowPageBreak: data.layout.allowPageBreak !== undefined ? data.layout.allowPageBreak : false
    };
  }

  /**
   * Saves the layout configuration and closes the dialog.
   * Returns the updated layout configuration to the caller.
   */
  onSave(): void {
    this.dialogRef.close(this.layout);
  }

  /**
   * Cancels the dialog without saving changes.
   * Closes the dialog and returns nothing.
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Resets the layout configuration to default values.
   * Restores all settings to their default state.
   */
  onReset(): void {
    this.layout = {
      orientation: 'portrait',
      pageSize: 'A4',
      showHeader: true,
      showFooter: true,
      showPageNumbers: true,
      showGridLines: true,
      topMargin: 20,
      bottomMargin: 20,
      leftMargin: 20,
      rightMargin: 20,
      headerFontSize: 14,
      bodyFontSize: 12,
      repeatHeaderOnEachPage: true,
      fitToPage: true,
      allowPageBreak: false
    };
  }
}
