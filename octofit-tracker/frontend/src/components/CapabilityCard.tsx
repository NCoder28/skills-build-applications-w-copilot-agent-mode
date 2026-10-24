import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ApiItem = Record<string, unknown>;

type Props = {
  title: string;
  description: string;
  path: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: ApiItem) => ReactNode;
};

function isApiItem(value: unknown): value is ApiItem {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readItems(response: unknown, dataKey: string): ApiItem[] {
  if (!isApiItem(response) || !(dataKey in response)) {
    throw new Error('The server returned an unexpected response.');
  }

  const items = response[dataKey];
  if (!Array.isArray(items) || !items.every(isApiItem)) {
    throw new Error('The server returned an unexpected response.');
  }

  return items;
}

export function CapabilityCard({ title, description, path, dataKey, emptyMessage, renderItem }: Props) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getJson<unknown>(path)
      .then((response) => {
        if (active) setItems(readItems(response, dataKey));
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, dataKey]);

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
            {items.map((item, index) => <li className="list-group-item" key={String(item._id ?? index)}>{renderItem(item)}</li>)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
