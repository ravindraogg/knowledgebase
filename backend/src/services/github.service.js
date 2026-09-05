import { Octokit } from 'octokit';
import Integration from '../models/Integration.js';
import { decrypt } from './encryption.service.js';

function parseRepoFullName(fullName) {
  const parts = fullName.split('/');
  return { owner: parts[0], repo: parts[1] };
}

export async function getOctokit(orgId) {
  const integration = await Integration.findOne({ orgId, type: 'github', status: 'active' });
  if (!integration) throw new Error('No active GitHub integration. Connect one in Settings > Integrations.');
  const creds = JSON.parse(decrypt(integration.credentials));
  if (!creds.accessToken) throw new Error('GitHub access token not found in stored credentials.');
  return { octokit: new Octokit({ auth: creds.accessToken }), integration };
}

export async function listUserRepos(orgId) {
  const { octokit } = await getOctokit(orgId);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    per_page: 100,
    sort: 'updated',
    affiliation: 'owner,collaborator',
  });
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    url: r.html_url,
    cloneUrl: r.clone_url,
    defaultBranch: r.default_branch,
    language: r.language,
    private: r.private,
    updatedAt: r.updated_at,
  }));
}

export async function getRepoDetails(orgId, owner, repo) {
  const { octokit } = await getOctokit(orgId);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

export async function listCommits(orgId, owner, repo, perPage = 50) {
  const { octokit } = await getOctokit(orgId);
  const { data } = await octokit.rest.repos.listCommits({ owner, repo, per_page: perPage });
  return data;
}

export async function getCommitDiff(orgId, owner, repo, ref) {
  const { octokit } = await getOctokit(orgId);
  const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref });
  return data;
}
