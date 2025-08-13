import { Component, Input } from "@angular/core";
import { ReportBuilderService } from "../../services/report-builder.service";
import { FilterCondition, GroupByField, LayoutConfiguration, ReportDefinition, SortField } from "../../../../core/models/report.models";
import { PreviewResult } from "../../../../core/models/preview-result.model";

@Component({
  selector: 'app-chart-preview',
  template: `
  
  `,
  styleUrls: ['./chart-preview.component.scss']
})
export class ChartPreviewComponent {
    @Input() data: PreviewResult = {} as PreviewResult;
    @Input() fields: any[] = [];
    @Input() groupBy: GroupByField[] = [];
    @Input() sortBy: SortField[] = [];
    @Input() filters: FilterCondition[] = [];
    @Input() layout: LayoutConfiguration = {} as LayoutConfiguration;
    @Input() format: string = 'table';
    @Input() isLoading: boolean = false;
    @Input() report: ReportDefinition = {} as ReportDefinition;

    constructor(private reportBuilderService: ReportBuilderService) {}

    ngOnInit(): void {
        this.reportBuilderService.previewReport(this.report)
        .subscribe((data) => {
            this.data = data;
        });
    }

}