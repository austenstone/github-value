import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableComponent } from './shared/table/table.component';


@NgModule({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterModule, //.forRoot(routes, { anchorScrolling: 'enabled', scrollOffset: [0, 64] }),
    ReactiveFormsModule,
    MaterialModule,
    TableComponent
  ],
  exports: [
    RouterOutlet,
    RouterLink,
    RouterModule,
    ReactiveFormsModule,
    MaterialModule,
    CommonModule,
    TableComponent
  ]
})
export class AppModule { }
