import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      dataKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => <>{String(team.name)}{Array.isArray(team.members) ? ` - ${team.members.length} members` : ''}</>}
    />
  );
}
