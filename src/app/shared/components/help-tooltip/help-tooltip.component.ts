import { Component, Input } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";

/**
 * Simple help tooltip component that displays contextual help information.
 * Uses Material Tooltip to show help text when hovering over the icon.
 * Reusable component for providing inline help throughout the application.
 */
// shared/components/help-tooltip/help-tooltip.component.ts
@Component({
  selector: 'app-help-tooltip',
  imports:[ MatTooltipModule ],
  template: `
    <div class="help-tooltip" 
         [matTooltip]="helpText" 
         matTooltipPosition="above"
         matTooltipClass="custom-tooltip">
      <i class="icon-help"></i>
    </div>
  `,
  styleUrls: ['./help-tooltip.component.scss']
})
export class HelpTooltipComponent {
  /** Help text to display in the tooltip */
  @Input() helpText: string = '';
}