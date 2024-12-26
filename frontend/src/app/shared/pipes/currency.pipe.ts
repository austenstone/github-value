import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'matCurrencyPipe'
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | string): string {
    if (typeof value === 'string') {
      value = parseFloat(value.replace(/,/g, ''));
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}
