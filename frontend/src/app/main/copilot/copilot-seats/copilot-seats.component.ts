import { Component, OnInit } from '@angular/core';
import { ColumnOptions, TableComponent } from '../../../shared/table/table.component';
import { AllSeats, Seat, SeatService } from '../../../services/api/seat.service';
import { SortDirection } from '@angular/material/sort';
import { Router } from '@angular/router';
import { InstallationsService } from '../../../services/api/installations.service';
import { takeUntil } from 'rxjs';

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
  seats?: AllSeats[];
  tableColumns: ColumnOptions[] = [
    { 
      columnDef: 'avatar', 
      header: '', 
      cell: (element: AllSeats) => `${element.avatar_url}`,
      isImage: true
    },
    { 
      columnDef: 'login', 
      header: 'User', 
      cell: (element: AllSeats) => `${element.login}`,
      // link: (element: AllSeats) => `https://github.com/${element.assignee.login}`
    },
    { 
      columnDef: 'last_activity_at', 
      header: 'Last Active', 
      cell: (element: AllSeats) => element.seat?.last_activity_at ? new Date(element.seat.last_activity_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'
    },
    { 
      columnDef: 'last_activity_editor', 
      header: 'Editor', 
      cell: (element: AllSeats) => element.seat?.last_activity_editor?.split('/')[0] || '-',
      chipList: true,
      chipListIcon: (element: AllSeats) => this.getIconForEditor(element.seat?.last_activity_editor),
    },
    { 
      columnDef: 'created_at', 
      header: 'Created', 
      cell: (element: AllSeats) => element.seat?.created_at ? new Date(element.seat.created_at).toLocaleString([], { dateStyle: 'short' }) : '-'
    },
    { 
      columnDef: 'plan_type', 
      header: 'Plan', 
      cell: (element: AllSeats) => `${element.seat?.plan_type || 'disabled'}`,
      chipList: true,
      chipListIcon: (element: AllSeats) => element.seat?.plan_type === 'enterprise' ? 'corporate_fare' : element.seat?.plan_type === 'business' ? 'paid' : 'close'
    },
    { 
      columnDef: 'org', 
      header: 'Org', 
      cell: (element: AllSeats) => `${element.org}`,
    }
  ];
  defaultSort = {id: 'last_activity_at', start: 'desc' as SortDirection, disableClear: false};
  sortingDataAccessor = (item: AllSeats, property: string) => {
    switch(property) {
      case 'login':
        return item.login.toLowerCase();
      default:
        return item.seat?.[property as keyof Seat]
    }
  };
  filterPredicate = (data: AllSeats, filter: string) => {
    const searchStr = JSON.stringify(data).toLowerCase();
    return searchStr.includes(filter);
  };

  constructor(
    private seatsService: SeatService,
    private router: Router,
    private installationsService: InstallationsService
  ) {}

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.seatsService.getAllSeats(installation?.account?.login).subscribe(seats => {
        this.seats = seats;
      });
    });
  }

  onRowClick(seat: AllSeats) {
    if (seat.id) {
      this.router.navigate(['/copilot/seats', seat.id]);
    }
  }

  getIconForEditor(editor: string | null | undefined) {
    if (!editor) return 'help';
    const lower = editor.toLocaleLowerCase();
    if (lower.includes('vscode')) {
      return 'svg:editor-vscode';
    } if (lower.includes('visualstudio')) {
      return 'svg:editor-visual-studio';
    } else if (lower.includes('jetbrains')) {
      return 'svg:editor-jetbrains';
    } else if (lower.includes('xcode')) {
      return 'svg:editor-xcode';
    } else if (lower.includes('vim')) {
      return 'code';
    } else if (lower.includes('github')) {
      return 'svg:github';
    } else if (lower.includes('copilot')) {
      return 'svg:github-copilot';
    } else if (lower.startsWith('-')) {
      return 'help';
    }  else if (lower.startsWith('unknown')) {
      return 'help';
    }
    return ``;
  }
}
