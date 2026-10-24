import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      dataKey="suggestions"
      emptyMessage="No workout suggestions yet."
      renderItem={(workout) => <>{String(workout.title)}{typeof workout.focus === 'string' ? ` - ${workout.focus}` : ''}{typeof workout.reason === 'string' ? `: ${workout.reason}` : ''}</>}
    />
  );
}
