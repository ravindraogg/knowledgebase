import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { canChangeRole, canInviteAsRole, canRemoveUser } from '../services/rbac.service.js';
import { Repo } from '../models/Repo.js';

async function validateScopes(orgId, repoIds = [], slackChannels = []) {
  if (!Array.isArray(repoIds) || !Array.isArray(slackChannels)) throw new Error('Scopes must be arrays');
  const uniqueRepoIds = [...new Set(repoIds.map(String))];
  const matched = await Repo.countDocuments({ _id: { $in: uniqueRepoIds }, orgId });
  if (matched !== uniqueRepoIds.length) throw new Error('One or more selected repositories are outside this organization');
  return { repoIds: uniqueRepoIds, slackChannels: [...new Set(slackChannels.map((channel) => String(channel).trim()).filter(Boolean))] };
}

export async function getOrg(req, res) {
  try {
    const org = await Organization.findById(req.user.orgId);
    if (!org) return res.status(404).json({ error: 'NotFoundError', message: 'Organization not found' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function updateOrg(req, res) {
  try {
    const allowed = ['name', 'website', 'industry', 'companySize'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const org = await Organization.findByIdAndUpdate(req.user.orgId, updates, { new: true });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function listMembers(req, res) {
  try {
    const members = await User.find({ orgId: req.user.orgId }).select('-passwordHash');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function inviteUser(req, res) {
  try {
    const { email, role, repoIds = [], slackChannels = [] } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'ValidationError', message: 'email and role are required' });
    }
    if (!['admin', 'member', 'viewer'].includes(role) || !canInviteAsRole(req.user, role)) {
      return res.status(400).json({ error: 'ValidationError', message: 'role must be admin, member, or viewer' });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), orgId: req.user.orgId });
    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'User already in organization' });
    }

    const scopes = await validateScopes(req.user.orgId, repoIds, slackChannels);
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await Invitation.create({
      orgId: req.user.orgId,
      email: email.toLowerCase(),
      role,
      allowedRepoIds: scopes.repoIds,
      allowedSlackChannels: scopes.slackChannels,
      invitedBy: req.user.userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json(invitation);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

// Creates a member account and returns the temporary password exactly once.
// This is intended for an organization administrator provisioning employees.
export async function provisionUser(req, res) {
  try {
    const { name, email, role, repoIds = [], slackChannels = [] } = req.body;
    if (!name?.trim() || !email?.trim() || !role) return res.status(400).json({ error: 'ValidationError', message: 'name, email, and role are required' });
    if (!['admin', 'member', 'viewer'].includes(role) || !canInviteAsRole(req.user, role)) return res.status(403).json({ error: 'Forbidden', message: 'You cannot provision that role' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Conflict', message: 'An account already uses this email address' });
    const scopes = await validateScopes(req.user.orgId, repoIds, slackChannels);
    const temporaryPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash, orgId: req.user.orgId, role, status: 'active', invitedBy: req.user.userId, invitedAt: new Date(), allowedRepoIds: scopes.repoIds, allowedSlackChannels: scopes.slackChannels });
    res.status(201).json({ user: await User.findById(user._id).select('-passwordHash'), temporaryPassword });
  } catch (err) {
    res.status(400).json({ error: 'ValidationError', message: err.message });
  }
}

export async function changeMemberRole(req, res) {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid role' });
    }
    const target = await User.findOne({ _id: req.params.userId, orgId: req.user.orgId });
    if (!target) return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
    if (!canChangeRole(req.user, target, role)) return res.status(403).json({ error: 'Forbidden', message: 'You cannot change this member role' });
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, orgId: req.user.orgId },
      { role },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function updateMemberScopes(req, res) {
  try {
    const target = await User.findOne({ _id: req.params.userId, orgId: req.user.orgId });
    if (!target) return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
    if (!canChangeRole(req.user, target, target.role)) return res.status(403).json({ error: 'Forbidden', message: 'You cannot change this member scope' });
    const scopes = await validateScopes(req.user.orgId, req.body.repoIds || [], req.body.slackChannels || []);
    target.allowedRepoIds = scopes.repoIds;
    target.allowedSlackChannels = scopes.slackChannels;
    await target.save();
    res.json(await User.findById(target._id).select('-passwordHash'));
  } catch (err) { res.status(400).json({ error: 'ValidationError', message: err.message }); }
}

export async function removeMember(req, res) {
  try {
    const target = await User.findOne({ _id: req.params.userId, orgId: req.user.orgId });
    if (!target) return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
    if (!canRemoveUser(req.user, target)) return res.status(403).json({ error: 'Forbidden', message: 'You cannot remove this member' });
    const user = await User.findByIdAndDelete(target._id);
    if (!user) return res.status(404).json({ error: 'NotFoundError', message: 'User not found' });
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
