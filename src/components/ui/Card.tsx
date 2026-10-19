import type { ReactNode } from "react";

export function Card({ title, right, children }: { title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="cardhead">
        <h2>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
