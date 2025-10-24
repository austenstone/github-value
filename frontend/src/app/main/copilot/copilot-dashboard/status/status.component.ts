import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusComponent {
  @Input() title?: string;
  @Input() message?: string;
  @Input() status?: 'success' | 'error' | 'warning' = 'error';
  // Indicates underlying data is incomplete due to time cap / early stop
  @Input() partial?: boolean;
  // Optional counts to show brief context if provided
  @Input() fetchedCount?: number;
  @Input() totalCount?: number;
}
