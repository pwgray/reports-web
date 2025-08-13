import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FieldDataType, FieldFormatting, SelectedField } from '../../../../core/models/report.models';

export interface FieldFormatDialogData {
  field: SelectedField;
}

@Component({
  selector: 'app-field-format-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Format “{{ data.field.displayName }}”</h2>

    <div mat-dialog-content class="dialog-content">
    <!-- Display Name -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Display Name</mat-label>
        <input matInput type="text" [(ngModel)]="data.field.displayName" />
      </mat-form-field>

      <!-- Format type -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Format Type</mat-label>
        <mat-select [(ngModel)]="format.formatType">
          <mat-option *ngFor="let opt of formatTypeOptions" [value]="opt.value">
            {{ opt.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Number/currency options -->
      <ng-container *ngIf="isNumeric(data.field)">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Decimal Places</mat-label>
          <input matInput type="number" min="0" max="6" [(ngModel)]="format.decimalPlaces" />
        </mat-form-field>

        <mat-form-field *ngIf="format.formatType === 'currency'" appearance="outline" class="half-width">
          <mat-label>Currency Code</mat-label>
          <mat-select [(ngModel)]="format.currencyCode">
            <mat-option value="USD">USD</mat-option>
            <mat-option value="EUR">EUR</mat-option>
            <mat-option value="GBP">GBP</mat-option>
            <mat-option value="JPY">JPY</mat-option>
          </mat-select>
        </mat-form-field>
      </ng-container>

      <!-- Date options -->
      <ng-container *ngIf="data.field.dataType === FieldDataType.DATE">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date Format</mat-label>
          <mat-select [(ngModel)]="format.dateFormat">
            <mat-option value="MM/dd/yyyy">MM/dd/yyyy</mat-option>
            <mat-option value="dd/MM/yyyy">dd/MM/yyyy</mat-option>
            <mat-option value="yyyy-MM-dd">yyyy-MM-dd</mat-option>
            <mat-option value="MMM d, yyyy">MMM d, yyyy</mat-option>
          </mat-select>
        </mat-form-field>
      </ng-container>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="onSave()">Save</button>
    </div>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      min-width: 420px;
    }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 6px); min-width: 180px; }
  `]
})
export class FieldFormatDialogComponent {
  FieldDataType = FieldDataType;

  format: FieldFormatting = {
    formatType: undefined,
    decimalPlaces: undefined,
    dateFormat: undefined,
    currencyCode: undefined
  };

  formatTypeOptions: Array<{ label: string; value: FieldFormatting['formatType'] }> = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FieldFormatDialogData,
    private dialogRef: MatDialogRef<FieldFormatDialogComponent>
  ) {
    // Initialize from existing formatting or sensible defaults based on data type
    const existing = data.field.formatting || {};
    const dt = data.field.dataType;

    if (this.isNumeric(data.field)) {
      this.formatTypeOptions = [
        { label: 'Decimal', value: 'decimal' },
        { label: 'Percentage', value: 'percentage' },
        { label: 'Currency', value: 'currency' }        
      ];
      this.format = {
        formatType: existing.formatType || (dt === FieldDataType.CURRENCY || dt === FieldDataType.MONEY ? 'currency' : 'decimal'),
        decimalPlaces: existing.decimalPlaces ?? 2,
        currencyCode: existing.currencyCode || 'USD'
      };
    } else if (dt === FieldDataType.DATE) {
      this.formatTypeOptions = [{ label: 'Date', value: 'date' }];
      this.format = {
        formatType: 'date',
        dateFormat: existing.dateFormat || 'MM/dd/yyyy'
      };
    } else {
      this.formatTypeOptions = [{ label: 'Text', value: 'string' }];
      this.format = { formatType: 'string' };
    }
  }

  isNumeric(field: SelectedField): boolean {
    return field.dataType === FieldDataType.NUMBER || field.dataType === FieldDataType.CURRENCY || field.dataType === FieldDataType.SMALLINT || field.dataType === FieldDataType.BIGINT || field.dataType === FieldDataType.FLOAT || field.dataType === FieldDataType.DOUBLE || field.dataType === FieldDataType.DECIMAL || field.dataType === FieldDataType.NUMERIC || field.dataType === FieldDataType.MONEY;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Return updated field with new formatting
    const updatedField: SelectedField = {
      ...this.data.field,
      formatting: { ...this.format }
    };
    this.dialogRef.close(updatedField);
  }
}