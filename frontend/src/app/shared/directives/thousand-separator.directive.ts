import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[matThousandSeparator]'
})
export class ThousandSeparatorDirective {
  private regex: RegExp = new RegExp(/^\d+$/);

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/,/g, '');
    if (this.regex.test(value)) {
      value = this.formatNumber(value);
      input.value = value;
    } else {
      input.value = input.value.slice(0, -1);
    }
  }

  private formatNumber(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
