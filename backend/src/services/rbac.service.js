const ROLE_LEVEL = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
  super_admin: 5,
};

export { ROLE_LEVEL };

export function canChangeRole(actor, target, newRole) {
  if (actor.role === 'owner') {
    if (actor._id.toString() === target._id.toString() && newRole !== 'owner') return false;
    return true;
  }
  if (actor.role === 'admin') {
    if (ROLE_LEVEL[target.role] >= ROLE_LEVEL.admin) return false;
    if (ROLE_LEVEL[newRole] >= ROLE_LEVEL.admin) return false;
    return true;
  }
  return false;
}

export function canRemoveUser(actor, target) {
  if (actor._id.toString() === target._id.toString()) return false;
  if (ROLE_LEVEL[target.role] >= ROLE_LEVEL[actor.role]) return false;
  return true;
}

export function canInviteAsRole(actor, inviteRole) {
  if (ROLE_LEVEL[inviteRole] >= ROLE_LEVEL[actor.role]) return false;
  if (inviteRole === 'owner' || inviteRole === 'super_admin') return false;
  return true;
}
