import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AggregationType, FieldFormatting, WidgetConfig } from "../../../../core/models/report.models";

@Component({
    selector: 'app-widget-preview',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="widget-container" *ngIf="config; else noConfig">
            <div class="widget-header" *ngIf="config.title">
                <h5 class="widget-title">{{ config.title }}</h5>
            </div>

            <!-- TEXT -->
            <div *ngIf="config.type === 'text'" class="widget-content text-widget">
                <p class="widget-text">{{ config.text || '—' }}</p>
            </div>

            <!-- METRIC / KPI -->
            <div *ngIf="config.type === 'metric' || config.type === 'kpi'" class="widget-content metric-widget" [class.kpi]="config.type === 'kpi'">
                <div class="metric-main">
                    <span class="metric-value">{{ formattedValue }}</span>
                </div>
                <div class="metric-sub" *ngIf="subLabel">
                    <span class="metric-label">{{ subLabel }}</span>
                </div>
            </div>

            <!-- TREND -->
            <div *ngIf="config.type === 'trend'" class="widget-content trend-widget">
                <div class="trend-header">
                    <span class="trend-value">{{ formattedLatest }}</span>
                    <span class="trend-delta" [class.pos]="trendDelta >= 0" [class.neg]="trendDelta < 0">
                        <span class="arrow">{{ trendDelta >= 0 ? '▲' : '▼' }}</span>
                        {{ trendDelta | number:'1.0-2' }}%
                    </span>
                </div>
                <svg class="sparkline" [attr.viewBox]="'0 0 ' + sparkWidth + ' ' + sparkHeight" preserveAspectRatio="none">
                    <polyline class="spark-path" [attr.points]="sparkPoints"></polyline>
                </svg>
                <div class="trend-footer" *ngIf="subLabel">
                    <span class="metric-label">{{ subLabel }}</span>
                </div>
            </div>

            <!-- EMPTY STATE -->
            <div *ngIf="!hasRenderableData" class="widget-empty">
                <p>No data to display.</p>
            </div>
        </div>

        <ng-template #noConfig>
            <div class="widget-container widget-empty">
                <p>No widget configuration.</p>
            </div>
        </ng-template>
    `,
    styleUrls: ['./widget-preview.component.scss']
})
export class WidgetPreviewComponent implements OnChanges {
    @Input() data: any[] = [];
    @Input() config: WidgetConfig = {} as WidgetConfig;

    // Computed display values
    formattedValue: string = '';
    formattedLatest: string = '';
    subLabel: string = '';
    trendDelta: number = 0;

    // Sparkline
    sparkPoints: string = '';
    sparkWidth = 160;
    sparkHeight = 40;

    get hasRenderableData(): boolean {
        if (!this.config) return false;
        if (this.config.type === 'text') return true;
        if (!this.config.field?.fieldName) return false;
        return Array.isArray(this.data) && this.data.length > 0;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.compute();
    }

    private compute(): void {
        this.formattedValue = '';
        this.formattedLatest = '';
        this.subLabel = this.buildSubLabel();
        this.trendDelta = 0;
        this.sparkPoints = '';

        if (!this.config || this.config.type === 'text') {
            return;
        }

        const fieldName = this.config.field?.fieldName;
        if (!fieldName || !this.data || this.data.length === 0) {
            return;
        }

        const rawVals = this.data
            .map(r => Number(r[fieldName]))
            .filter(v => Number.isFinite(v));

        if (rawVals.length === 0) return;

        // METRIC / KPI
        if (this.config.type === 'metric' || this.config.type === 'kpi') {
            const agg = this.config.aggregation || AggregationType.SUM;
            const value = this.aggregate(rawVals, agg);
            this.formattedValue = this.formatValue(value, this.config.valueFormat);
            return;
        }

        // TREND
        if (this.config.type === 'trend') {
            const latest = rawVals[rawVals.length - 1];
            const first = rawVals[0];
            this.trendDelta = first === 0 ? 0 : ((latest - first) / Math.abs(first)) * 100;
            this.formattedLatest = this.formatValue(latest, this.config.valueFormat);
            this.sparkPoints = this.buildSparkline(rawVals);
            return;
        }
    }

    private aggregate(values: number[], agg: AggregationType): number {
        switch (agg) {
            case AggregationType.COUNT:
                return values.length;
            case AggregationType.AVG:
                return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            case AggregationType.MIN:
                return Math.min(...values);
            case AggregationType.MAX:
                return Math.max(...values);
            case AggregationType.SUM:
            default:
                return values.reduce((a, b) => a + b, 0);
        }
    }

    private formatValue(value: number, fmt?: FieldFormatting): string {
        if (value === null || value === undefined || !Number.isFinite(value)) return '—';
        const decimals = Math.max(0, Math.min(6, fmt?.decimalPlaces ?? 0));
        switch (fmt?.formatType) {
            case 'currency':
            case 'money':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: fmt?.currencyCode || 'USD',
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }).format(value);
            case 'percentage':
                return new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }).format(value);
            case 'decimal':
            case 'float':
            case 'double':
            case 'numeric':
                return new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }).format(value);
            default:
                return new Intl.NumberFormat('en-US').format(value);
        }
    }

    private buildSubLabel(): string {
        if (!this.config) return '';
        if (this.config.type === 'text') return '';
        const parts: string[] = [];
        if (this.config.aggregation) parts.push(this.config.aggregation.toString().toLowerCase());
        if (this.config.field?.displayName) parts.push(this.config.field.displayName);
        return parts.join(' of ');
    }

    private buildSparkline(values: number[]): string {
        const w = this.sparkWidth;
        const h = this.sparkHeight;
        const pad = 2;

        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min || 1;
        const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;

        const pts = values.map((v, i) => {
            const x = pad + i * stepX;
            const y = pad + (h - pad * 2) * (1 - (v - min) / span);
            return `${x},${y}`;
        });

        return pts.join(' ');
    }
}