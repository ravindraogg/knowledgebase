import mongoose from 'mongoose';

const queryLogSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  title: { type: String, default: '' },
  generatedCypher: { type: String, default: null },
  answer: { type: String, default: '' },
  workspaceResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  sourceNodeIds: [{ type: String }],
  repoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repo' }],
  latencyMs: { type: Number, default: 0 },
}, { timestamps: true });

queryLogSchema.index({ orgId: 1, createdAt: -1 });
queryLogSchema.index({ userId: 1, createdAt: -1 });

export const QueryLog = mongoose.model('QueryLog', queryLogSchema);
