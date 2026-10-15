import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page skeleton: header band + content slots (alert, step 1, steps 2–3). Knows nothing about data. */
@Component({
  selector: 'app-reconciliation-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <header class="layout__header">
      <div class="layout__container layout__header-inner">
        <p class="layout__eyebrow">Gerencia de Evolución Contable y Tributaria</p>
        <h1 class="layout__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="layout__subtitle">{{ subtitle() }}</p>
        }
      </div>
    </header>
    <main id="main-content" class="layout__container layout__main" tabindex="-1">
      <ng-content select="[layoutAlert]" />
      <ng-content select="[layoutUpload]" />
      <ng-content select="[layoutResults]" />
    </main>
    <footer class="layout__footer layout__container">
      Prototipo. Los archivos se procesan en el momento y no se almacenan.
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }
    .layout__container {
      width: 100%;
      max-width: 84rem;
      margin: 0 auto;
      padding-inline: var(--space-5);
    }
    @media (max-width: 40rem) {
      .layout__container { padding-inline: var(--space-4); }
    }
    .layout__header {
      background: var(--color-header-bg);
      color: var(--color-header-ink);
      border-bottom: 4px solid var(--color-accent);
    }
    .layout__header-inner { padding-block: var(--space-5); }
    .layout__eyebrow {
      margin: 0;
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      letter-spacing: var(--tracking-caps);
      text-transform: uppercase;
      color: var(--color-header-soft);
    }
    .layout__title {
      margin: var(--space-1) 0 0;
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
    }
    .layout__subtitle {
      margin: var(--space-1) 0 0;
      max-width: 44rem;
      font-size: var(--text-sm);
      color: var(--color-header-soft);
    }
    .layout__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding-block: var(--space-5) var(--space-6);
      outline: none;
    }
    .layout__main > * { min-width: 0; }
    .layout__footer {
      padding-block: 0 var(--space-5);
      font-size: var(--text-xs);
      color: var(--color-ink-faint);
    }
  `,
})
export class ReconciliationLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
