import type { ReactNode } from 'react';

export function Placeholder({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="card placeholder">
        <div className="ic">{icon}</div>
        <h2>Coming soon</h2>
        <p className="muted">{description}</p>
      </div>
    </>
  );
}
