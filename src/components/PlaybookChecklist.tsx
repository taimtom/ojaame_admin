import { PHASE_LABELS, type PlaybookPhase, type PlaybookProgress, type StepGuide } from '../lib/salesPlaybook';
import { PlaybookStepGuide } from './PlaybookStepGuide';

type Props = {
  playbook: PlaybookProgress;
  converted?: boolean;
  onMarkDone?: (stepKey: string) => void;
  onUndo?: (stepKey: string) => void;
  readOnly?: boolean;
  onCopyScript?: (text: string) => void;
};

const PHASE_ORDER: PlaybookPhase[] = ['prospect', 'conversion', 'adoption'];

export function PlaybookChecklist({
  playbook,
  converted = false,
  onMarkDone,
  onUndo,
  readOnly = false,
  onCopyScript,
}: Props) {
  const byPhase = PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase],
    steps: playbook.steps.filter((s) => s.phase === phase),
  }));

  return (
    <div className="playbook-checklist">
      {byPhase.map(({ phase, label, steps }) => {
        const dimmed = phase === 'adoption' && !converted;
        return (
          <section key={phase} className={dimmed ? 'playbook-phase dimmed' : 'playbook-phase'}>
            <h3 className="playbook-phase-title">{label}</h3>
            <ul className="playbook-steps">
              {steps.map((step) => (
                <li key={step.key} className={step.done ? 'playbook-step done' : 'playbook-step'}>
                  <div className="playbook-step-main">
                    <span className="playbook-step-check" aria-hidden>
                      {step.done ? '✓' : '○'}
                    </span>
                    <div className="playbook-step-content">
                      <strong>{step.label}</strong>
                      <span className="muted playbook-step-meta">
                        {step.weight}%
                        {step.auto && ' · auto'}
                        {step.done_at && ` · ${new Date(step.done_at).toLocaleDateString()}`}
                      </span>
                      {step.note && <p className="muted playbook-step-note">{step.note}</p>}
                      <PlaybookStepGuide
                        guide={step.guide as StepGuide | undefined}
                        onCopyScript={onCopyScript}
                      />
                    </div>
                  </div>
                  {!readOnly && step.completion_type === 'manual' && (
                    <div className="playbook-step-actions">
                      {!step.done && onMarkDone && (
                        <button
                          type="button"
                          className="btn primary btn-sm"
                          onClick={() => onMarkDone(step.key)}
                        >
                          Mark done
                        </button>
                      )}
                      {step.done && onUndo && (
                        <button
                          type="button"
                          className="btn ghost btn-sm"
                          onClick={() => onUndo(step.key)}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
