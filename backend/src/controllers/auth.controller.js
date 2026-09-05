import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { env } from '../config/env.js';

/**
 * POST /api/auth/register
 * Create organization + owner user from onboarding form
 */
export async function register(req, res) {
  try {
    const {
      email,
      password,
      name,
      orgName,
      // Onboarding metadata
      website,
      industry,
      companySize,
      jobTitle,
      phone,
      useCases,
      deploymentPreference,
      expectedRepoCount,
    } = req.body;

    if (!email || !password || !name || !orgName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'email, password, name, and orgName are required.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists. Please sign in.',
      });
    }

    // Generate org slug from name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if org slug already exists; append random suffix if so
    let finalSlug = slug;
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create organization
    const org = await Organization.create({
      name: orgName,
      slug: finalSlug,
      tier: 'starter',
      website: website || null,
      industry: industry || null,
      companySize: companySize || null,
      useCases: useCases || [],
      deploymentPreference: deploymentPreference || 'cloud',
      expectedRepoCount: expectedRepoCount || null,
    });

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create owner user
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      orgId: org._id,
      role: 'owner',
      status: 'active',
      jobTitle: jobTitle || null,
      phone: phone || null,
      lastLoginAt: new Date(),
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        orgId: org._id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: org._id,
        orgName: org.name,
        orgSlug: org.slug,
      },
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

/**
 * POST /api/auth/login
 * Email/password login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required.',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'No account found with this email.',
      });
    }

    // Check status
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Contact your organization admin.',
      });
    }

    // Validate password
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'This account uses OAuth login. Please sign in with GitHub.',
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect password.',
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch org name
    const org = await Organization.findById(user.orgId);

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        orgId: user.orgId,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRY }
    );

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgName: org?.name || '',
        orgSlug: org?.slug || '',
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

/**
 * GET /api/auth/me
 * Get current user from JWT
 */
export async function githubOAuth(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'ValidationError', message: 'Authorization code is required' });
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: 'ConfigurationError', message: 'GitHub OAuth is not configured on the server.' });
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'OAuthError', message: tokenData.error_description || 'Failed to exchange authorization code' });
    }

    const Integration = (await import('../models/Integration.js')).default;
    const { encrypt } = await import('../services/encryption.service.js');

    const encrypted = encrypt(JSON.stringify({ accessToken: tokenData.access_token }));
    const integration = await Integration.findOneAndUpdate(
      { orgId: req.user.orgId, type: 'github' },
      {
        orgId: req.user.orgId,
        type: 'github',
        credentials: encrypted,
        status: 'active',
        metadata: { connectedAt: new Date().toISOString(), oauth: 'true' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-credentials');

    res.json({ success: true, integration });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function logout(req, res) {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended.',
      });
    }

    const org = await Organization.findById(user.orgId);

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        orgName: org?.name || '',
        orgSlug: org?.slug || '',
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        allowedRepoIds: user.allowedRepoIds || [],
        allowedSlackChannels: user.allowedSlackChannels || [],
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
