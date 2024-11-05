import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortable, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { Input } from '@angular/core';


export interface ColumnOptions {
  columnDef: string;
  header: string;
  cell: (element: any) => string;
  link?: (element: any) => string;
};

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements AfterViewInit {
  dataSource: MatTableDataSource<any>;
  @Input() data: any[] = [];
  @Input() columns: ColumnOptions[] = [];
  @Input() defaultSort?: MatSortable;
  displayedColumns = this.columns.map(c => c.columnDef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(this.data);
    console.log(this.data);
  }

  ngAfterViewInit() {
    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource.data = this.data;
    this.dataSource.paginator = this.paginator;
    if (this.defaultSort) {
      this.sort.sort(this.defaultSort);
    }
    this.dataSource.sort = this.sort;
    
    console.log(this.data);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
