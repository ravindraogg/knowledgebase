import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, enum: ['github', 'jira', 'slack'], required: true },
  credentials: {
    encryptedPayload: { type: String, default: null },
    iv: { type: String, default: null },
    authTag: { type: String, default: null },
  },
  status: { type: String, enum: ['active', 'revoked', 'error'], default: 'active' },
  lastTestedAt: { type: Date, default: null },
  metadata: { type: Map, of: String, default: {} },
}, { timestamps: true });

integrationSchema.index({ orgId: 1, type: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;
