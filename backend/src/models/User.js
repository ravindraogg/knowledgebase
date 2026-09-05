import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'owner', 'admin', 'member', 'viewer'],
    default: 'member',
  },
  // Empty means unrestricted within the organization. These constraints are
  // evaluated on the server, never trusted from the dashboard alone.
  allowedRepoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repo' }],
  allowedSlackChannels: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended'],
    default: 'active',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  invitedAt: {
    type: Date,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  githubId: {
    type: String,
    default: null,
  },
  // Company onboarding metadata
  jobTitle: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

userSchema.index({ orgId: 1 });

const User = mongoose.model('User', userSchema);
export default User;
