import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

export enum DateRangeOption {
  WEEK = 'week',
  MONTH = 'month',
  LAST_MONTH = 'lastMonth',
  THIRTY_DAYS = '30days',
  NINETY_DAYS = '90days',
  YEAR = 'year',
  CUSTOM = 'custom'
}

@Component({
  selector: 'app-date-range-select',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatDatepickerModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-select.component.html',
  styleUrl: './date-range-select.component.scss'
})
export class DateRangeSelectComponent implements OnDestroy {
  @Output() dateRangeChange = new EventEmitter<{ start: Date, end: Date }>();
  private subscriptions: Subscription[] = [];
  type = new FormControl();
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  selectedRange: DateRangeOption = DateRangeOption.THIRTY_DAYS; // Default to 30 days 📅
  minDate: Date = new Date(2022, 0, 1);
  maxDate: Date = new Date();

  constructor() {
    this.type.setValue(DateRangeOption.THIRTY_DAYS);
    this.range.setValue({
      start: this.daysAgo(30),
      end: new Date()
    });
    this.subscriptions.push(
      this.type.valueChanges.subscribe((value: DateRangeOption) => {
        this.onRangeChange(value);
      })
    );
    this.subscriptions.push(
      this.range.valueChanges.subscribe(value => {
        if (value.start && value.end) {
          this.dateRangeChange.emit({
            start: value.start,
            end: value.end
          });
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  daysAgo(numDays: number): Date {
    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - numDays);
    return daysAgo;
  }

  onRangeChange(option: DateRangeOption) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (option) {
      case 'week': {
        const currentDay = today.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        start.setDate(today.getDate() - daysToMonday);
        end.setDate(start.getDate() + 6);
      }
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case '30days':
        start.setDate(today.getDate() - 30);
        break;
      case '90days':
        start.setDate(today.getDate() - 90);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        return;
    }

    this.range.setValue({ start, end });
  }
}
