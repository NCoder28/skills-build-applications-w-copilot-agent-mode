import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function normalizeId(value: unknown, label: string) {
  if (!value || typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw badRequest(`Invalid ${label}.`);
  }
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const userId = normalizeId(body.userId, 'userId');
  const teamId = normalizeId(body.teamId, 'teamId');

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw badRequest('Activity references must match an existing user and team.');
  }

  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = Number(body.minutes);

  if (!type || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity requires a valid type and minutes.');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  const teams = await Team.find().lean();
  return teams.map((team) => ({
    ...team,
    members: (team.members ?? []).map((member) => (typeof member === 'string' ? member : member.toString())),
  }));
}

export async function createTeam(input: unknown) {
  const body = (input ?? {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';

  if (!name) {
    throw badRequest('Team name is required.');
  }

  const rawMembers = Array.isArray(body.members) ? body.members : [];
  const members = rawMembers
    .map((member) => {
      if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) {
        throw badRequest('Team members must be valid object IDs.');
      }
      return new mongoose.Types.ObjectId(member);
    });

  const team = await Team.create({
    name,
    mascot,
    members,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail?.trim();
  if (!email) {
    throw badRequest('A user email is required.');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const focusPreferences = new Set<string>();
  if (user.fitnessGoal) {
    focusPreferences.add(String(user.fitnessGoal).trim());
  }
  for (const activity of recentActivities) {
    if (activity.type) {
      focusPreferences.add(String(activity.type).trim());
    }
  }

  const candidates = await Workout.find().lean();
  const prioritized = candidates
    .map((workout) => {
      const workoutFocus = String(workout.focus ?? '').trim();
      const matchesGoal = workoutFocus && focusPreferences.has(workoutFocus);
      const matchesRecentType = recentActivities.some((activity) => {
        const type = String(activity.type ?? '').trim();
        return type && workoutFocus.toLowerCase() === type.toLowerCase();
      });
      const score = Number(matchesGoal) * 2 + Number(matchesRecentType);
      return { workout, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.workout.title.localeCompare(b.workout.title));

  const recommended = prioritized.length > 0 ? prioritized : [{ workout: candidates[0], score: 0 }].filter(Boolean);
  return recommended.map(({ workout }) => ({
    ...workout,
    reason: workout.focus && focusPreferences.has(String(workout.focus).trim())
      ? `Matches your goal: ${workout.focus}.`
      : `Based on your recent activity patterns.`,
  }));
}

export { User };
