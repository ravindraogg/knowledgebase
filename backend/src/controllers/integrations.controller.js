import Integration from '../models/Integration.js';
import { encrypt, decrypt } from '../services/encryption.service.js';

export async function listIntegrations(req, res) {
  try {
    const integrations = await Integration.find({ orgId: req.user.orgId })
      .select('-credentials');
    res.json(integrations);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function connectGitHub(req, res) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'ValidationError', message: 'accessToken is required' });
    }

    const encrypted = encrypt(JSON.stringify({ accessToken }));
    const integration = await Integration.findOneAndUpdate(
      { orgId: req.user.orgId, type: 'github' },
      {
        orgId: req.user.orgId,
        type: 'github',
        credentials: encrypted,
        status: 'active',
        metadata: { connectedAt: new Date().toISOString() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-credentials');

    res.status(201).json(integration);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function connectJira(req, res) {
  try {
    const { baseUrl, email, apiToken } = req.body;
    if (!baseUrl || !email || !apiToken) {
      return res.status(400).json({ error: 'ValidationError', message: 'baseUrl, email, and apiToken are required' });
    }

    const encrypted = encrypt(JSON.stringify({ baseUrl, email, apiToken }));
    const integration = await Integration.findOneAndUpdate(
      { orgId: req.user.orgId, type: 'jira' },
      {
        orgId: req.user.orgId,
        type: 'jira',
        credentials: encrypted,
        status: 'active',
        metadata: { baseUrl, connectedAt: new Date().toISOString() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-credentials');

    res.status(201).json(integration);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function connectSlack(req, res) {
  try {
    const { botToken, signingSecret } = req.body;
    if (!botToken || !signingSecret) {
      return res.status(400).json({ error: 'ValidationError', message: 'botToken and signingSecret are required' });
    }

    const encrypted = encrypt(JSON.stringify({ botToken, signingSecret }));
    const integration = await Integration.findOneAndUpdate(
      { orgId: req.user.orgId, type: 'slack' },
      {
        orgId: req.user.orgId,
        type: 'slack',
        credentials: encrypted,
        status: 'active',
        metadata: { connectedAt: new Date().toISOString() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-credentials');

    res.status(201).json(integration);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function disconnectIntegration(req, res) {
  try {
    const integration = await Integration.findOneAndDelete({
      _id: req.params.integrationId,
      orgId: req.user.orgId,
    });
    if (!integration) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Integration not found' });
    }
    res.json({ success: true, message: 'Integration disconnected' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function testIntegration(req, res) {
  try {
    const integration = await Integration.findOne({
      _id: req.params.integrationId,
      orgId: req.user.orgId,
    });
    if (!integration) {
      return res.status(404).json({ error: 'NotFoundError', message: 'Integration not found' });
    }

    integration.lastTestedAt = new Date();
    await integration.save();

    res.json({ healthy: integration.status === 'active', message: `Integration ${integration.type} is ${integration.status}` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
