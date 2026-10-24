import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name?: string; members?: Array<string | { toString(): string }> };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await getJson<{ teams?: TeamRecord[] }>('/api/teams');
        if (mounted) setTeams(payload.teams ?? []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load teams.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      status={loading ? <p role="status">Loading...</p> : error ? <p role="alert">Unable to load teams.</p> : null}
    >
      {!loading && !error && (teams.length === 0 ? <p>No teams.</p> : <ul className="list-group list-group-flush">{teams.map((team, index) => <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item"><strong>{team.name ?? 'Team'}</strong>{team.members && team.members.length > 0 ? <div>{team.members.map((member) => String(member)).join(', ')}</div> : <div>No members listed.</div>}</li>)}</ul>)}
    </CapabilityCard>
  );
}
