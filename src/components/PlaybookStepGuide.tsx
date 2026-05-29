import { useState } from 'react';

export type StepGuide = {
  summary?: string;
  goal?: string;
  success?: string[];
  how_to?: string[];
  questions?: string[];
  script?: string;
  script_filled?: string;
  template_id?: string;
  pitch_by_pain?: Record<string, string>;
};

type Props = {
  guide: StepGuide | null | undefined;
  onCopyScript?: (text: string) => void;
};

export function PlaybookStepGuide({ guide, onCopyScript }: Props) {
  const [open, setOpen] = useState(false);

  if (!guide?.summary) return null;

  const script = guide.script_filled || guide.script;

  return (
    <div className="step-guide">
      <button type="button" className="step-guide-toggle" onClick={() => setOpen(!open)}>
        {open ? 'Hide guide' : 'What is this step?'}
      </button>
      {open && (
        <div className="step-guide-body">
          <p>{guide.summary}</p>
          {guide.goal && (
            <p>
              <strong>Goal:</strong> {guide.goal}
            </p>
          )}
          {guide.success && guide.success.length > 0 && (
            <>
              <strong>Done when:</strong>
              <ul>
                {guide.success.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
          {guide.questions && guide.questions.length > 0 && (
            <>
              <strong>Discovery questions:</strong>
              <ul>
                {guide.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </>
          )}
          {guide.how_to && guide.how_to.length > 0 && (
            <>
              <strong>How to:</strong>
              <ul>
                {guide.how_to.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </>
          )}
          {guide.pitch_by_pain && (
            <>
              <strong>Lead with (by pain):</strong>
              <ul>
                {Object.entries(guide.pitch_by_pain).map(([k, v]) => (
                  <li key={k}>
                    <em>{k}</em>: {v}
                  </li>
                ))}
              </ul>
            </>
          )}
          {script && (
            <div className="script-block">
              <strong>Script / template:</strong>
              <pre>{script}</pre>
              {onCopyScript && (
                <button type="button" className="btn btn-sm" onClick={() => onCopyScript(script)}>
                  Copy
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
