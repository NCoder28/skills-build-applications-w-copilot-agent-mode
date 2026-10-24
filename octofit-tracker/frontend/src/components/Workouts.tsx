import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const email = 'mona@example.com';
        const payload = await getJson<{ suggestions?: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);
        if (mounted) setSuggestions(payload.suggestions ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load workout suggestions.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      status={loading ? <p role="status">Loading...</p> : error ? <p role="alert">Unable to load workout suggestions.</p> : null}
    >
      {!loading && !error && (suggestions.length === 0 ? <p>No workout suggestions.</p> : <ul className="list-group list-group-flush">{suggestions.map((suggestion, index) => <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item"><strong>{suggestion.title ?? 'Workout'}</strong>{suggestion.reason ? <div>{suggestion.reason}</div> : null}{suggestion.focus ? <div>Focus: {suggestion.focus}</div> : null}</li>)}</ul>)}
    </CapabilityCard>
  );
}
