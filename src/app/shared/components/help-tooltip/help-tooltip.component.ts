import { Component, Input } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";

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
  @Input() helpText: string = '';
}