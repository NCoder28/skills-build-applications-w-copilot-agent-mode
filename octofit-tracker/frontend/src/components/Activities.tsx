import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await getJson<{ activities?: ActivityRecord[] }>('/api/activities');
        if (mounted) setActivities(payload.activities ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load activities.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      status={loading ? <p role="status">Loading...</p> : error ? <p role="alert">Unable to load activities.</p> : null}
    >
      {!loading && !error && (activities.length === 0 ? <p>No activities.</p> : <ul className="list-group list-group-flush">{activities.map((activity, index) => <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">{activity.type ?? 'Activity'} · {activity.minutes ?? 0} minutes · {activity.points ?? 0} pts</li>)}</ul>)}
    </CapabilityCard>
  );
}
