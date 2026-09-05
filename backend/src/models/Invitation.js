import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], required: true },
  allowedRepoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repo' }],
  allowedSlackChannels: [{ type: String, trim: true }],
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true });

invitationSchema.index({ orgId: 1, email: 1 }, { unique: true });
invitationSchema.index({ token: 1 }, { unique: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
