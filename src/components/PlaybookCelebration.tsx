import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { markCelebrationShown } from '../lib/salesPlaybook';

type Props = {
  open: boolean;
  shopName: string;
  kind: 'prospect' | 'company';
  resourceId: number;
  onClose: () => void;
};

export function PlaybookCelebration({ open, shopName, kind, resourceId, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    markCelebrationShown(kind, resourceId);

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        zIndex: 10000,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        zIndex: 10000,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      zIndex: 10000,
    });
  }, [open, kind, resourceId]);

  if (!open) return null;

  return (
    <div className="celebration-overlay" role="dialog" aria-modal="true">
      <div className="celebration-card">
        <p className="celebration-emoji" aria-hidden>
          🎉
        </p>
        <h2>Hurray!</h2>
        <p>
          <strong>{shopName}</strong> is fully onboarded — 100% playbook complete.
        </p>
        <button type="button" className="btn primary" onClick={onClose}>
          Awesome
        </button>
      </div>
    </div>
  );
}
