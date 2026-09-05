import mongoose from 'mongoose';

const repoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  repoUrl: { type: String, required: true },
  branch: { type: String, default: 'main' },
  status: { type: String, enum: ['active', 'error', 'inactive'], default: 'active' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
}, { timestamps: true });

repoSchema.index({ orgId: 1 });

export const Repo = mongoose.model('Repo', repoSchema);
