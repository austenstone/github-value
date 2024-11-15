import { Component, OnInit } from '@angular/core';
import { ColumnOptions, TableComponent } from '../../../shared/table/table.component';
import { Seat, SeatService } from '../../../services/seat.service';
import { SortDirection } from '@angular/material/sort';

@Component({
  selector: 'app-seats',
  standalone: true,
  imports: [
    TableComponent
  ],
  templateUrl: './copilot-seats.component.html',
  styleUrl: './copilot-seats.component.scss'
})
export class CopilotSeatsComponent implements OnInit {
  seats?: Seat[];
  tableColumns: ColumnOptions[] = [
    { 
      columnDef: 'avatar', 
      header: '', 
      cell: (element: Seat) => `${element.assignee.avatar_url}`,
      isImage: true
    },
    { 
      columnDef: 'login', 
      header: 'User', 
      cell: (element: Seat) => `${element.assignee.login}`,
      link: (element: Seat) => `https://github.com/${element.assignee.login}`
    },
    { 
      columnDef: 'plan_type', 
      header: 'Plan', 
      cell: (element: Seat) => `${element.plan_type}`
    },
    { 
      columnDef: 'last_activity_at', 
      header: 'Last Active', 
      cell: (element: Seat) => element.last_activity_at ? new Date(element.last_activity_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'
    },
    { 
      columnDef: 'created_at', 
      header: 'Created', 
      cell: (element: Seat) => new Date(element.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    },
    { 
      columnDef: 'last_activity_editor', 
      header: 'Editor', 
      cell: (element: Seat) => element.last_activity_editor || '-'
    }
  ];
  defaultSort = {id: 'last_activity_at', start: 'desc' as SortDirection, disableClear: false};
  sortingDataAccessor = (item: Seat, property: string) => {
    switch(property) {
      case 'login':
        return (item.assignee as { login: string })?.login.toLowerCase();
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (item as any)[property];
    }
  };
  filterPredicate = (data: Seat, filter: string) => {
    const searchStr = JSON.stringify(data).toLowerCase();
    return searchStr.includes(filter);
  };

  constructor(
    private seatsService: SeatService
  ) {}

  ngOnInit() {
    this.seatsService.getAllSeats().subscribe(seats => {
      this.seats = seats as Seat[];
    });
  }
}
