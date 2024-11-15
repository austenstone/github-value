/* eslint-disable @typescript-eslint/no-explicit-any */
import {Component, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortable, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


export interface ColumnOptions {
  columnDef: string;
  header: string;
  cell: (element: any) => string;
  link?: (element: any) => string;
  isImage?: boolean;
  isIcon?: boolean;
  iconColor?: string;
  noWrap?: boolean;
};

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnChanges  {
  dataSource!: MatTableDataSource<any>;
  @Input() data?: any[] = [];
  @Input() columns: ColumnOptions[] = [];
  @Input() defaultSort?: MatSortable;
  @Input() sortingDataAccessor?: (item: any, property: string) => any;
  @Input() filterPredicate?: (data: any, filter: string) => boolean;
  @Input() filterPlaceholder = 'Ex. Mona';
  displayedColumns = this.columns.map(c => c.columnDef);
  isLoadingResults = true;
  isError = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource();
    this.dataSource.data = this.data!;
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['columns']) {
      this.displayedColumns = this.columns.map(c => c.columnDef);
    }
    if (changes['data']) {
      if (this.data) {
        this.setData(this.data);
      }
    }
  }

  setData(data: any[]) {
    this.isLoadingResults = true;
    try {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      if (this.sortingDataAccessor) {
        this.dataSource.sortingDataAccessor = this.sortingDataAccessor
      }
      if (this.filterPredicate) {
        this.dataSource.filterPredicate = this.filterPredicate
      }
      if (this.defaultSort) {
        this.sort.sort(this.defaultSort);
      }
    } finally {
      this.isLoadingResults = false;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
