import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  tier: {
    type: String,
    enum: ['starter', 'growth', 'enterprise'],
    default: 'starter',
  },
  website: {
    type: String,
    default: null,
  },
  industry: {
    type: String,
    default: null,
  },
  companySize: {
    type: String,
    default: null,
  },
  // Onboarding interest metadata
  useCases: [{
    type: String,
    enum: ['github', 'jira', 'slack', 'legacy_codebase', 'dpdp_compliance'],
  }],
  deploymentPreference: {
    type: String,
    enum: ['cloud', 'on_prem', 'byoc'],
    default: 'cloud',
  },
  expectedRepoCount: {
    type: String,
    default: null,
  },
  dpdpCompliance: {
    dataResidency: { type: String, default: 'IN' },
    consentTimestamp: { type: Date, default: null },
    encryptionVerified: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// organizationSchema.index({ slug: 1 }); // unique: true is set on slug field

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
