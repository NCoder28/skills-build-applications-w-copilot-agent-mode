import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (mounted) setLeaderboard(payload.leaderboard ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load leaderboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      status={loading ? <p role="status">Loading...</p> : error ? <p role="alert">Unable to load leaderboard.</p> : null}
    >
      {!loading && !error && (leaderboard.length === 0 ? <p>No leaderboard.</p> : <ol className="list-group list-group-numbered">{leaderboard.map((entry) => <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 'rank'}`} className="list-group-item">#{entry.rank ?? '-'} {entry.teamName ?? 'Team'} — {entry.totalPoints ?? 0} points</li>)}</ol>)}
    </CapabilityCard>
  );
}
