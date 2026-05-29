import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function MobilePageHeader({ title, backTo, backLabel = '← Back', actions }: Props) {
  return (
    <header className="mobile-page-header">
      <div className="mobile-page-header-row">
        {backTo ? (
          <Link to={backTo} className="mobile-back-link">
            {backLabel}
          </Link>
        ) : (
          <span />
        )}
        {actions}
      </div>
      <h1>{title}</h1>
    </header>
  );
}
