import { Component } from '@angular/core';
import { SettingsHttpService } from '../../../services/settings.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [],
  templateUrl: './copilot-calculator.component.html',
  styleUrl: './copilot-calculator.component.scss'
})
export class CopilotCalculatorComponent {
  constructor(
    private settingsService: SettingsHttpService,

  ) {
    settingsService.getAllSettings().subscribe(settings => {
      console.log(settings);
    });
  }
}