import type { ReactNode } from 'react';

type Props = { title: string; description: string; status?: ReactNode; children?: ReactNode };
export function CapabilityCard({ title, description, status, children }: Props) {
  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{status}{children}</div></section>;
}
