import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThousandSeparatorDirective } from './directives/thousand-separator.directive';
import { CurrencyPipe } from './pipes/currency.pipe';

@NgModule({
  declarations: [ThousandSeparatorDirective, CurrencyPipe],
  imports: [CommonModule],
  exports: [ThousandSeparatorDirective, CurrencyPipe]
})
export class SharedModule {}
