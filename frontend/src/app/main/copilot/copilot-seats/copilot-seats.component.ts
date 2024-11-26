import { Component, OnInit } from '@angular/core';
import { ColumnOptions, TableComponent } from '../../../shared/table/table.component';
import { Seat, SeatService } from '../../../services/api/seat.service';
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
      columnDef: 'last_activity_at', 
      header: 'Last Active', 
      cell: (element: Seat) => element.last_activity_at ? new Date(element.last_activity_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'
    },
    { 
      columnDef: 'last_activity_editor', 
      header: 'Editor', 
      cell: (element: Seat) => element.last_activity_editor?.split('/')[0] || '-',
      chipList: true,
      chipListIcon: (element: Seat) => this.getIconForEditor(element.last_activity_editor),
    },
    { 
      columnDef: 'created_at', 
      header: 'Created', 
      cell: (element: Seat) => new Date(element.created_at).toLocaleString([], { dateStyle: 'short' })
    },
    { 
      columnDef: 'plan_type', 
      header: 'Plan', 
      cell: (element: Seat) => `${element.plan_type}`,
      chipList: true,
      chipListIcon: (element: Seat) => element.plan_type === 'enterprise' ? 'corporate_fare' : 'paid'
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
    private seatsService: SeatService,
    private router: Router,
    private installationsService: InstallationsService
  ) {}

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.seatsService.getAllSeats(installation?.account?.login).subscribe(seats => {
        this.seats = seats as Seat[];
      });
    });
  }

  onRowClick(seat: Seat) {
    if (seat.assignee.id) {
      this.router.navigate(['/copilot/seats', seat.assignee.id]);
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
