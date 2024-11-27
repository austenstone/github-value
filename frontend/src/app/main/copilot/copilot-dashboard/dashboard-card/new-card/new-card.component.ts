import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-new-card',
  templateUrl: './new-card.component.html',
  styleUrls: ['./new-card.component.scss'],
  providers: [DatePipe],
  standalone: true,
  imports: [MatCardModule]
})
export class NewCardComponent implements OnInit {
  @Input() title?: string;
  @Input() statusMessage?: string;
  currentDate?: string;

  constructor(private datePipe: DatePipe) {}

  ngOnInit() {
    this.currentDate = this.datePipe.transform(new Date(), 'fullDate') || '';
  }
}