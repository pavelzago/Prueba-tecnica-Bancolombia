import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'check'
  | 'alert'
  | 'search'
  | 'close'
  | 'download'
  | 'file'
  | 'upload'
  | 'swap'
  | 'table'
  | 'chart'
  | 'chevron-left'
  | 'chevron-right'
  | 'sun'
  | 'moon'
  | 'monitor';

/** 24×24 stroke paths (drawn for this app). Decorative unless `label` is given. */
const PATHS: Record<IconName, string> = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 7.5v6M12 16.8v.2M12 3l9.5 17h-19z',
  search: 'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L20 20',
  close: 'M6 6l12 12M18 6L6 18',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  upload: 'M12 16V5M7 9.5l5-5 5 5M5 20h14',
  swap: 'M7 7h12l-3-3M17 17H5l3 3',
  table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14',
  chart: 'M4 20h16M7 16V10M12 16V5M17 16v-4',
  'chevron-left': 'M14.5 6l-6 6 6 6',
  'chevron-right': 'M9.5 6l6 6-6 6',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z',
  monitor: 'M3.5 4.5h17v11h-17zM9 20h6M12 15.5V20',
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icon' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      focusable="false"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; line-height: 0; }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number | string>('1em');
  readonly strokeWidth = input(2);
  readonly label = input('');

  protected readonly path = computed(() => PATHS[this.name()]);
}
