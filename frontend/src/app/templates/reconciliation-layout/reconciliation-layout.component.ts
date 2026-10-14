import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page skeleton: header + content slots. Knows nothing about data. */
@Component({
  selector: 'app-reconciliation-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <header class="layout__header">
      <div class="layout__container">
        <p class="layout__eyebrow">Evolución Contable y Tributaria</p>
        <h1 class="layout__title">{{ title() }}</h1>
        <p class="layout__subtitle">{{ subtitle() }}</p>
      </div>
    </header>
    <main id="main-content" class="layout__container layout__main" tabindex="-1">
      <ng-content select="[layoutAlert]" />
      <ng-content select="[layoutUpload]" />
      <ng-content select="[layoutResults]" />
    </main>
    <footer class="layout__footer layout__container">
      Prototipo — los archivos se procesan en el momento y no se almacenan.
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .layout__container {
      width: 100%;
      max-width: 82rem;
      margin: 0 auto;
      padding: 0 var(--space-4);
    }
    .layout__header {
      background: var(--color-ink);
      color: var(--color-surface);
      border-bottom: 6px solid var(--color-accent);
      padding: var(--space-6) 0;
    }
    .layout__eyebrow {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-accent);
    }
    .layout__title {
      margin: var(--space-1) 0;
      font-size: clamp(1.5rem, 3vw, 2rem);
    }
    .layout__subtitle {
      margin: 0;
      max-width: 48rem;
      color: #d4d4d4;
    }
    .layout__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding-top: var(--space-6);
      padding-bottom: var(--space-6);
      outline: none;
    }
    .layout__footer {
      padding-bottom: var(--space-6);
      font-size: 0.8rem;
      color: var(--color-ink-soft);
    }
  `,
})
export class ReconciliationLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
