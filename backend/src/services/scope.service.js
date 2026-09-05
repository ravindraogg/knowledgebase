import User from '../models/User.js';

export async function getAccessScope(userId) {
  const user = await User.findById(userId).select('role allowedRepoIds allowedSlackChannels');
  if (!user) return null;
  return {
    role: user.role,
    repoIds: (user.allowedRepoIds || []).map((id) => id.toString()),
    slackChannels: user.allowedSlackChannels || [],
  };
}

export function canAccessRepo(scope, repoId) {
  return !scope?.repoIds?.length || scope.repoIds.includes(repoId.toString());
}
