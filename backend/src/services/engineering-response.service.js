const INTENT_RULES = [
  ['security_review', /\b(vulnerabilit(?:y|ies)|vuln(?:erability)?|security|exploit|cve|xss|csrf|injection|auth(?:entication|orization)?)\b/i],
  ['architecture', /\b(architecture|system|overview|structure|pipeline)\b/i],
  ['workflow', /\b(workflow|flow|how .* work|process|lifecycle)\b/i],
  ['dependency_analysis', /\b(depend|import|uses?|reference|relationship)\b/i],
  ['commit_history', /\b(commit|changed|history|recent changes)\b/i],
  ['code_ownership', /\b(who|owner|modified|author|maintain)\b/i],
  ['entity_detail', /\b(explain|why does|what is|function|class|method|service|controller)\b/i],
  ['search', /\b(find|search|list|show)\b/i],
];

// Small, dependency-free spelling normalizer for important engineering terms.
// Retrieval must not fail just because a user types "vernaility".
const QUERY_ALIASES = new Map([
  ['vulnerability', ['vulnerability', 'vulnerabilities', 'vuln', 'security', 'exploit', 'xss', 'csrf', 'injection']],
  ['security', ['security', 'vulnerability', 'vulnerabilities', 'auth', 'authorization', 'authentication']],
]);

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = saved;
    }
  }
  return previous[right.length];
}

export function normalizeQueryTerms(question = '') {
  const rawTerms = question.toLowerCase().match(/[a-z0-9_]+/g) || [];
  const terms = new Set(rawTerms);
  for (const rawTerm of rawTerms) {
    for (const [canonical, aliases] of QUERY_ALIASES) {
      // Only correct substantial words so short identifiers are never changed.
      if (rawTerm.length >= 6 && editDistance(rawTerm, canonical) <= 5) {
        aliases.forEach((alias) => terms.add(alias));
      }
    }
  }
  return terms;
}

export function detectIntent(question = '') {
  const normalizedQuestion = [...normalizeQueryTerms(question)].join(' ');
  return INTENT_RULES.find(([, rule]) => rule.test(normalizedQuestion))?.[0] || 'general_qa';
}

export function rankRepositoryContext({ question, entities = [], commits = [], limit = 12 }) {
  const terms = normalizeQueryTerms(question);
  const score = (value) => {
    const haystack = `${value.name || ''} ${value.path || ''} ${value.signature || ''} ${value.message || ''} ${value.description || ''} ${value.evidence || ''} ${value.type || ''}`.toLowerCase();
    const termScore = [...terms].reduce((total, term) => total + (haystack.includes(term) ? 2 : 0), 0);
    return termScore + (value.type === 'security_finding' ? 8 : 0) + (value.type === 'file' ? 0.2 : 0);
  };
  const rankedEntities = [...entities].map((entity) => ({ ...entity, score: score(entity) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
  const rankedCommits = [...commits].map((commit) => ({ ...commit, score: score(commit) })).sort((a, b) => b.score - a.score).slice(0, 6);
  return { entities: rankedEntities, commits: rankedCommits };
}

export function formatEngineeringResponse({ question, intent, answer, sources = [], entities = [], commits = [] }) {
  const evidence = sources.slice(0, 8).map((source) => ({
    id: source.id,
    name: source.name,
    type: source.type,
    path: source.path,
    message: source.message,
    author: source.author,
    signature: source.signature,
  }));
  const entityCards = entities.slice(0, 8).map((entity) => ({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    purpose: entity.signature ? `Declared as ${entity.signature}` : `Relevant ${entity.type} found in the knowledge graph.`,
    location: entity.path,
    signature: entity.signature || undefined,
  }));
  const evidenceRatio = Math.min(1, evidence.length / 5);
  const confidence = Math.round((0.45 + evidenceRatio * 0.4 + (entities.length > 0 ? 0.1 : 0) + (commits.length > 0 ? 0.05 : 0)) * 100);
  const relatedQuestions = intent === 'architecture'
    ? ['Show the execution workflow', 'List the core services', 'Show component dependencies']
    : intent === 'commit_history'
      ? ['Who owns these files?', 'Show related code changes', 'Explain the latest change']
      : ['Show related dependencies', 'Explain the most relevant entity', 'Show recent related changes'];

  return {
    type: entityCards.length > 1 ? 'entity_list' : entityCards.length === 1 ? 'entity_detail' : 'answer',
    intent,
    summary: answer.split('\n').find((line) => line.trim())?.replace(/[*`#]/g, '').slice(0, 280) || 'No grounded answer was available.',
    confidence: Math.min(confidence, 99),
    sections: [{ title: 'Analysis', body: answer, kind: 'analysis' }],
    entities: entityCards,
    evidence,
    relatedFiles: evidence.filter((item) => item.type !== 'commit'),
    relatedCommits: evidence.filter((item) => item.type === 'commit'),
    relatedQuestions,
  };
}
