import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  items: ReactNode[];
};

export function CapabilityCard({ title, description, loading, error, emptyMessage, items }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading {title.toLowerCase()}...</p> : null}
        {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p> : null}
        {!loading && !error && items.length === 0 ? <p>{emptyMessage}</p> : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="list-group">
            {items.map((item, index) => <li className="list-group-item" key={index}>{item}</li>)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
