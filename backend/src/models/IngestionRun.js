import mongoose from 'mongoose';

const ingestionRunSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repo', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
    default: 'queued',
  },
  stats: {
    entitiesCreated: { type: Number, default: 0 },
    entitiesUpdated: { type: Number, default: 0 },
    edgesCreated: { type: Number, default: 0 },
    commitsProcessed: { type: Number, default: 0 },
    errorsCount: { type: Number, default: 0 },
  },
  errorLog: { type: String, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

ingestionRunSchema.index({ orgId: 1, createdAt: -1 });
ingestionRunSchema.index({ repoId: 1, createdAt: -1 });

export const IngestionRun = mongoose.model('IngestionRun', ingestionRunSchema);
