import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterCondition, GroupByField, LayoutConfiguration, ReportDefinition, SortField, SelectedField, FieldDataType } from "../../../../core/models/report.models";

/**
 * Component for previewing chart visualizations of report data.
 * Supports bar charts and line charts based on selected fields and data.
 * Automatically determines X and Y axes from numeric and category fields.
 */
@Component({
  selector: 'app-chart-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" *ngIf="hasChartableData; else noData">
      <!-- Title / Meta -->
      <div class="chart-meta" *ngIf="xField && yField">
        <span class="axis-label">X: {{ xField.displayName }}</span>
        <span class="axis-label">Y: {{ yField.displayName }}</span>
        <span class="chart-type">Type: {{ chartType }}</span>
      </div>

      <!-- BAR CHART -->
      <svg *ngIf="chartType === 'bar'" class="chart-svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
        <!-- Axes -->
        <line x1="60" y1="340" x2="780" y2="340" class="axis" />
        <line x1="60" y1="40" x2="60" y2="340" class="axis" />

        <!-- Bars -->
        <g *ngFor="let bar of barRects">
          <rect
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.width"
            [attr.height]="bar.height"
            class="bar"
          ></rect>
          <title>{{ bar.label }}: {{ bar.value }}</title>
        </g>

        <!-- X labels -->
        <g *ngFor="let tick of xTicks">
          <text [attr.x]="tick.x" y="360" class="tick-label" text-anchor="middle">{{ tick.label }}</text>
        </g>

        <!-- Y ticks -->
        <g *ngFor="let tick of yTicks">
          <line x1="55" [attr.y1]="tick.y" x2="60" [attr.y2]="tick.y" class="tick" />
          <text x="50" [attr.y]="tick.y + 4" class="tick-label" text-anchor="end">{{ tick.label }}</text>
        </g>
      </svg>

      <!-- LINE CHART -->
      <svg *ngIf="chartType === 'line'" class="chart-svg" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
        <!-- Axes -->
        <line x1="60" y1="340" x2="780" y2="340" class="axis" />
        <line x1="60" y1="40" x2="60" y2="340" class="axis" />

        <!-- Line path -->
        <polyline [attr.points]="linePoints" class="line"></polyline>

        <!-- Points -->
        <g *ngFor="let p of linePointArray">
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" class="point"></circle>
          <title>{{ p.label }}: {{ p.value }}</title>
        </g>

        <!-- X labels -->
        <g *ngFor="let tick of xTicks">
          <text [attr.x]="tick.x" y="360" class="tick-label" text-anchor="middle">{{ tick.label }}</text>
        </g>

        <!-- Y ticks -->
        <g *ngFor="let tick of yTicks">
          <line x1="55" [attr.y1]="tick.y" x2="60" [attr.y2]="tick.y" class="tick" />
          <text x="50" [attr.y]="tick.y + 4" class="tick-label" text-anchor="end">{{ tick.label }}</text>
        </g>
      </svg>
    </div>

    <ng-template #noData>
      <div class="empty-chart">
        <p *ngIf="!xField || !yField">Select at least one category (text/date) and one numeric field to render a chart.</p>
        <p *ngIf="xField && yField && (!data || data.length === 0)">No data to display.</p>
        <p *ngIf="chartType === 'table'">Current selection is better suited for a table. Add a numeric field for charts.</p>
      </div>
    </ng-template>
  `,
  styleUrls: ['./chart-preview.component.scss']
})
export class ChartPreviewComponent implements OnChanges {
  /** Array of data rows to display in the chart */
  @Input() data: any[] = [];
  
  /** Selected fields from the report definition */
  @Input() fields: SelectedField[] = [];
  
  /** Group by fields configuration */
  @Input() groupBy: GroupByField[] = [];
  
  /** Sort fields configuration */
  @Input() sortBy: SortField[] = [];
  
  /** Filter conditions applied to the data */
  @Input() filters: FilterCondition[] = [];
  
  /** Layout configuration for the chart */
  @Input() layout: LayoutConfiguration = {} as LayoutConfiguration;
  
  /** Format type (currently unused, kept for compatibility) */
  @Input() format: string = 'table';
  
  /** Whether data is currently loading */
  @Input() isLoading: boolean = false;
  
  /** Complete report definition */
  @Input() report: ReportDefinition = {} as ReportDefinition;
  
  /** Type of chart to render: 'bar', 'line', or 'table' */
  @Input() chartType: 'bar' | 'line' | 'table' = 'bar';

  /** Derived fields */
  /** Field to use for the X-axis (category/date field) */
  xField: SelectedField | null = null;
  
  /** Field to use for the Y-axis (numeric field) */
  yField: SelectedField | null = null;

  /** Precomputed geometry */
  /** Array of bar rectangle coordinates and data for bar charts */
  barRects: Array<{ x: number; y: number; width: number; height: number; label: string; value: number }> = [];
  
  /** Array of X-axis tick positions and labels */
  xTicks: Array<{ x: number; label: string }> = [];
  
  /** Array of Y-axis tick positions and labels */
  yTicks: Array<{ y: number; label: string }> = [];
  
  /** SVG path points string for line charts */
  linePoints = '';
  
  /** Array of point coordinates for line charts */
  linePointArray: Array<{ x: number; y: number; label: string; value: number }> = [];

  /**
   * Determines if the component has valid data to render a chart.
   * Requires both X and Y fields, non-empty data array, and chart type that's not 'table'.
   * @returns True if chart can be rendered, false otherwise
   */
  get hasChartableData(): boolean {
    return !!this.xField && !!this.yField && Array.isArray(this.data) && this.data.length > 0 && this.chartType !== 'table';
  }

  /**
   * Angular lifecycle hook called when input properties change.
   * Recomputes field assignments and chart geometry.
   * @param changes - Object containing information about changed properties
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.resolveFields();
    this.computeGeometry();
  }

  /**
   * Resolves which fields should be used for X and Y axes.
   * X-axis uses category fields (date, string, boolean).
   * Y-axis uses numeric fields (number, currency, etc.).
   * @private
   */
  private resolveFields(): void {
    const isNumeric = (f: SelectedField) => [
      FieldDataType.NUMBER,
      FieldDataType.CURRENCY,
      FieldDataType.SMALLINT,
      FieldDataType.BIGINT,
      FieldDataType.FLOAT,
      FieldDataType.DOUBLE,
      FieldDataType.DECIMAL,
      FieldDataType.NUMERIC,
      FieldDataType.MONEY
    ].includes(f.dataType);

    const isCategory = (f: SelectedField) => [FieldDataType.DATE, FieldDataType.STRING, FieldDataType.BOOLEAN].includes(f.dataType);

    this.yField = this.fields.find(isNumeric) || null;
    this.xField = this.fields.find(isCategory) || null;
  }

  /**
   * Computes the geometry for chart rendering.
   * Calculates positions for bars, lines, ticks, and labels based on data and chart type.
   * @private
   */
  private computeGeometry(): void {
    this.barRects = [];
    this.xTicks = [];
    this.yTicks = [];
    this.linePoints = '';
    this.linePointArray = [];

    if (!this.xField || !this.yField || !this.data || this.data.length === 0) {
      return;
    }

    const width = 800;
    const height = 400;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 40;
    const paddingBottom = 60;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const labels = this.data.map(row => this.formatCategory(row[this.xField!.fieldName]));
    const values = this.data.map(row => Number(row[this.yField!.fieldName] ?? 0));
    const maxValue = Math.max(...values, 0);
    const yMax = maxValue === 0 ? 1 : maxValue;

    // Y ticks (5 steps)
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const yVal = yMax * (1 - ratio);
      const y = paddingTop + chartHeight * ratio;
      this.yTicks.push({ y, label: this.formatNumber(yVal) });
    }

    // X positions
    const count = this.data.length;
    const gap = 10;
    const barAreaWidth = chartWidth / Math.max(count, 1);
    const barWidth = Math.max(6, barAreaWidth - gap);

    this.xTicks = labels.map((label, index) => {
      const xCenter = paddingLeft + index * barAreaWidth + barAreaWidth / 2;
      return { x: xCenter, label };
    });

    if (this.chartType === 'bar') {
      this.barRects = values.map((v, index) => {
        const x = paddingLeft + index * barAreaWidth + (barAreaWidth - barWidth) / 2;
        const h = yMax === 0 ? 0 : (v / yMax) * chartHeight;
        const y = paddingTop + (chartHeight - h);
        return { x, y, width: barWidth, height: h, label: labels[index], value: v };
      });
    }

    if (this.chartType === 'line') {
      const points: string[] = [];
      this.linePointArray = values.map((v, index) => {
        const x = paddingLeft + index * barAreaWidth + barAreaWidth / 2;
        const y = paddingTop + (chartHeight - (yMax === 0 ? 0 : (v / yMax) * chartHeight));
        points.push(`${x},${y}`);
        return { x, y, label: labels[index], value: v };
      });
      this.linePoints = points.join(' ');
    }
  }

  /**
   * Formats a category value for display on the X-axis.
   * Handles date, boolean, and string types appropriately.
   * @param value - The raw value to format
   * @returns Formatted string representation
   * @private
   */
  private formatCategory(value: any): string {
    if (value === null || value === undefined) return '';
    if (this.xField?.dataType === FieldDataType.DATE) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
    }
    if (this.xField?.dataType === FieldDataType.BOOLEAN) {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }

  /**
   * Formats a numeric value for display on the Y-axis.
   * Uses locale-aware number formatting with rounded values.
   * @param value - The numeric value to format
   * @returns Formatted number string
   * @private
   */
  private formatNumber(value: number): string {
    return new Intl.NumberFormat().format(Math.round(value));
  }
}