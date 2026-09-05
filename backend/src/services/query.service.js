import { getNeo4jDriver } from '../config/neo4j.js';
import { reasonOverGraphContext } from './reasoning.service.js';
import { detectIntent, formatEngineeringResponse, rankRepositoryContext } from './engineering-response.service.js';
import { int } from 'neo4j-driver';

export async function processNaturalLanguageQuery(question, repoIds = []) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  const q = question.toLowerCase().trim();
  let cypher = '';
  let params = {};
  let templateMatched = 'fallback';

  // 1. Template matching
  const whyExistRegex = /(?:why does|explain|what is|tell me about) (?:function|class|method|interface)?\s*([a-zA-Z0-9_]+)/i;
  const dependsOnRegex = /(?:what depends on|what uses|what imports|dependencies of)\s*([a-zA-Z0-9_\-\.]+)/i;
  const listFunctionsRegex = /(?:what functions are in|list functions for|show functions of)\s*([a-zA-Z0-9_\-\.\/]+)/i;
  const recentCommitsRegex = /(?:what changed in|show me|list|recent)\s+(?:the\s+)?(?:last\s+)?(\d+)?\s*commits/i;
  const whoModifiedRegex = /who\s+(?:last\s+)?(?:modified|changed|edited|updated|committed)\s+([a-zA-Z0-9_\-\.\/]+)/i;
  const authorCommitsRegex = /(?:what did|commits by|changes by)\s+([a-zA-Z0-9_\-\.\s]+?)\s+(?:commit|make|do|author)?$/i;

  if (recentCommitsRegex.test(q)) {
    const match = q.match(recentCommitsRegex);
    const limit = Math.min(parseInt(match[1] || '5', 10), 50);
    templateMatched = 'recent_commits';
    cypher = `
      MATCH (n:Commit)
      WHERE 1=1
      RETURN n
      ORDER BY n.date DESC
      LIMIT ${limit}
    `;
    params = {};
  } else if (whoModifiedRegex.test(q)) {
    const match = q.match(whoModifiedRegex);
    const targetPath = match[1];
    templateMatched = 'who_modified';
    cypher = `
      MATCH (c:Commit)-[:CHANGES]->(e:CodeEntity)
      WHERE toLower(e.name) CONTAINS $targetPath OR toLower(e.path) CONTAINS $targetPath
      RETURN c, e
      ORDER BY c.date DESC
      LIMIT 10
    `;
    params = { targetPath: targetPath.toLowerCase() };
  } else if (authorCommitsRegex.test(q)) {
    const match = q.match(authorCommitsRegex);
    const author = match[1].trim();
    templateMatched = 'author_commits';
    cypher = `
      MATCH (n:Commit)
      WHERE toLower(n.author) CONTAINS $author
      RETURN n
      ORDER BY n.date DESC
      LIMIT 20
    `;
    params = { author: author.toLowerCase() };
  } else if (dependsOnRegex.test(q)) {
    const match = q.match(listFunctionsRegex);
    const targetPath = match[1];
    templateMatched = 'list_functions';
    cypher = `
      MATCH (file:CodeEntity {type: 'file'})-[r:CONTAINS]->(func:CodeEntity)
      WHERE file.path ENDS WITH $targetPath OR file.name = $targetPath
      RETURN file, r, func
      LIMIT 25
    `;
    params = { targetPath };
  } else if (whyExistRegex.test(q)) {
    const match = q.match(whyExistRegex);
    const entityName = match[1];
    templateMatched = 'why_exist';
    cypher = `
      MATCH (c:CodeEntity)
      WHERE c.name = $entityName
      OPTIONAL MATCH (parent:CodeEntity)-[:CONTAINS]->(c)
      RETURN c, parent
      LIMIT 5
    `;
    params = { entityName };
  } else {
    // Fallback: Text search
    cypher = `
      MATCH (c:CodeEntity)
      WHERE toLower(c.name) CONTAINS $query OR toLower(c.path) CONTAINS $query
      OPTIONAL MATCH (parent:CodeEntity)-[:CONTAINS]->(c)
      RETURN c, parent
      LIMIT 10
    `;
    params = { query: q };
  }

  // If repoIds are provided, constrain results by repo in Cypher
  if (repoIds.length > 0) {
    params.repoIds = repoIds;
    const filterVar = templateMatched === 'depends_on' ? 'from'
      : templateMatched === 'list_functions' ? 'file'
      : templateMatched === 'who_modified' ? 'e'
      : (templateMatched === 'recent_commits' || templateMatched === 'author_commits') ? 'n'
      : 'c';
    cypher += `\nAND ${filterVar}.repoId IN $repoIds`;
  }

  let answer = '';
  const sources = [];
  const nodes = [];
  const edges = [];

  try {
    const result = await session.run(cypher, params);
    const records = result.records;

    if (records.length === 0) {
      answer = `I scanned the knowledge graph but couldn't find any code entities matching your query for "${question}". Try checking the spelling of the class or function.`;
    } else {
      if (templateMatched === 'why_exist') {
        const primaryRecord = records[0];
        const entity = primaryRecord.get('c').properties;
        const parent = primaryRecord.get('parent')?.properties;

        answer = `Entity **${entity.name}** is a **${entity.type}** defined in **${entity.path}** (lines ${entity.startLine} to ${entity.endLine}).\n\n`;
        if (entity.signature) {
          answer += `**Signature:**\n\`\`\`typescript\n${entity.signature}\n\`\`\`\n\n`;
        }
        if (parent) {
          answer += `It is contained within the parent node **${parent.name}** (type: ${parent.type}).`;
        }

        // Add to sources
        sources.push({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          path: entity.path,
        });

        // Construct nodes and edges for graph explorer visualization
        records.forEach(rec => {
          const cNode = rec.get('c');
          const pNode = rec.get('parent');
          
          nodes.push({ id: cNode.properties.id, label: cNode.properties.name, type: cNode.properties.type });
          if (pNode) {
            nodes.push({ id: pNode.properties.id, label: pNode.properties.name, type: pNode.properties.type });
            edges.push({ from: pNode.properties.id, to: cNode.properties.id, type: 'CONTAINS' });
          }
        });
      } else if (templateMatched === 'depends_on') {
        const targetName = params.targetName;
        answer = `Here are the code files or functions that depend on **${targetName}**:\n\n`;
        records.forEach(rec => {
          const from = rec.get('from').properties;
          const to = rec.get('to').properties;
          answer += `- **${from.name}** (${from.type} in \`${from.path}\`) depends on **${to.name}** (${to.type})\n`;

          sources.push({
            id: from.id,
            name: from.name,
            type: from.type,
            path: from.path,
          });

          nodes.push({ id: from.id, label: from.name, type: from.type });
          nodes.push({ id: to.id, label: to.name, type: to.type });
          edges.push({ from: from.id, to: to.id, type: 'DEPENDS_ON' });
        });
      } else if (templateMatched === 'list_functions') {
        const targetPath = params.targetPath;
        answer = `Here are the functions defined inside **${targetPath}**:\n\n`;
        records.forEach(rec => {
          const file = rec.get('file').properties;
          const func = rec.get('func').properties;
          answer += `- **${func.name}** (lines ${func.startLine}-${func.endLine}) - Signature: \`${func.signature || 'N/A'}\`\n`;

          sources.push({
            id: func.id,
            name: func.name,
            type: func.type,
            path: func.path,
          });

          nodes.push({ id: file.id, label: file.name, type: file.type });
          nodes.push({ id: func.id, label: func.name, type: func.type });
          edges.push({ from: file.id, to: func.id, type: 'CONTAINS' });
        });
      } else if (templateMatched === 'recent_commits') {
        const commitCount = records.length;
        answer = `Here are the **${commitCount}** most recent commits:\n\n`;
        records.forEach((rec, i) => {
          const c = rec.get('n').properties;
          const date = c.date ? new Date(c.date.toString()).toLocaleDateString() : 'unknown date';
          const msg = (c.message || '').split('\n')[0];
          answer += `${i + 1}. **${msg}** — ${c.author} (${date})\n`;
          sources.push({
            id: c.sha,
            name: msg.substring(0, 60),
            type: 'commit',
            path: c.sha,
          });
        });
      } else if (templateMatched === 'who_modified') {
        const targetPath = params.targetPath;
        answer = `Here is who modified **${targetPath}**:\n\n`;
        const seen = new Set();
        records.forEach((rec) => {
          const c = rec.get('c').properties;
          const e = rec.get('e').properties;
          if (seen.has(c.sha)) return;
          seen.add(c.sha);
          const date = c.date ? new Date(c.date.toString()).toLocaleDateString() : 'unknown';
          const msg = (c.message || '').split('\n')[0];
          answer += `- **${c.author}** on ${date}: _${msg}_ (in \`${e.path}\`)\n`;
          sources.push({
            id: c.sha,
            name: msg.substring(0, 60),
            type: 'commit',
            path: e.path,
          });
        });
      } else if (templateMatched === 'author_commits') {
        const author = params.author;
        answer = `Commits by **${author}**:\n\n`;
        records.forEach((rec, i) => {
          const n = rec.get('n').properties;
          const date = n.date ? new Date(n.date.toString()).toLocaleDateString() : 'unknown';
          const msg = (n.message || '').split('\n')[0];
          answer += `${i + 1}. ${date} — **${msg}**\n`;
          sources.push({
            id: n.sha,
            name: msg.substring(0, 60),
            type: 'commit',
            path: n.sha,
          });
        });
      } else {
        // Fallback
        answer = `I found several matches for your query:\n\n`;
        records.forEach(rec => {
          const c = rec.get('c').properties;
          answer += `- **${c.name}** (${c.type} in \`${c.path}\`)\n`;

          sources.push({
            id: c.id,
            name: c.name,
            type: c.type,
            path: c.path,
          });

          nodes.push({ id: c.id, label: c.name, type: c.type });
        });
      }
    }
  } finally {
    await session.close();
  }

  // De-duplicate nodes
  const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());
  const uniqueEdges = Array.from(new Map(edges.map(e => [`${e.from}-${e.to}`, e])).values());

  const reasoning = await reasonOverGraphContext({
    question,
    retrievalAnswer: answer,
    sources,
  });

  return {
    answer: reasoning.answer,
    workspaceResponse: formatEngineeringResponse({ question, intent: detectIntent(question), answer: reasoning.answer, sources, entities: sources.filter((source) => source.type !== 'commit'), commits: sources.filter((source) => source.type === 'commit') }),
    validationTests: reasoning.validationTests,
    reasoning: {
      available: reasoning.reasoningAvailable,
      model: reasoning.model,
      failure: reasoning.reasoningFailure || null,
    },
    sources,
    graphSnippet: {
      nodes: uniqueNodes,
      edges: uniqueEdges,
    },
    generatedCypher: cypher,
  };
}

export async function ragQuery(question, repoIds = []) {
  if (repoIds.length === 0) {
    return {
      query: question,
      source: [],
      answer: 'Please select at least one repository to search.',
      latencyMs: 0,
    };
  }

  const driver = getNeo4jDriver();
  const session = driver.session();
  const startTime = Date.now();

  console.log(`[ragQuery] repoIds:`, JSON.stringify(repoIds));

  try {
    const entityResult = await session.run(
      `
      MATCH (n:CodeEntity)
      WHERE n.repoId IN $repoIds
      RETURN n
      ORDER BY n.type, n.path
      LIMIT 300
      `,
      { repoIds }
    );

    console.log(`[ragQuery] CodeEntity count: ${entityResult.records.length}`);
    if (entityResult.records.length > 0) {
      console.log(`[ragQuery] First entity:`, entityResult.records[0].get('n').properties);
    }

    const commitResult = await session.run(
      `
      MATCH (n:Commit)
      WHERE n.repoId IN $repoIds
      RETURN n
      ORDER BY n.date DESC
      LIMIT 100
      `,
      { repoIds }
    );

    console.log(`[ragQuery] Commit count: ${commitResult.records.length}`);

    const codeEntities = [];
    const commitEntities = [];

    entityResult.records.forEach(rec => {
      const props = rec.get('n').properties;
      codeEntities.push({
        id: props.id,
        name: props.name,
        type: props.type || 'unknown',
        path: props.path,
        signature: props.signature || null,
        language: props.language || null,
        startLine: props.startLine || null,
        endLine: props.endLine || null,
        severity: props.severity || null,
        description: props.description || null,
        evidence: props.evidence || null,
      });
    });

    commitResult.records.forEach(rec => {
      const props = rec.get('n').properties;
      commitEntities.push({
        id: props.sha,
        name: props.sha,
        type: 'commit',
        path: props.sha || '',
        author: props.author || 'unknown',
        message: props.message || '',
        date: props.date || null,
      });
    });

    const latencyMs = Date.now() - startTime;
    const allSources = [...codeEntities, ...commitEntities];

    if (allSources.length === 0) {
      return {
        query: question,
        source: [],
        answer: 'The selected repository has no data in the knowledge graph yet. The knowledge base is being built in the background — please try again in a few seconds.',
        latencyMs,
      };
    }

    const intent = detectIntent(question);
    const ranked = rankRepositoryContext({ question, entities: codeEntities, commits: commitEntities });
    const contextIntro = `Intent: ${intent}. The following are the most relevant retrieved code entities and commits for the user's question.\n\n`;
    const entityBlock = ranked.entities.length > 0
      ? `## Relevant code entities\n\n${ranked.entities.map(e =>
          `- **${e.name}** (${e.type} in \`${e.path}\`)${e.severity ? `\n  Severity: ${e.severity}` : ''}${e.description ? `\n  Finding: ${e.description}` : ''}${e.evidence ? `\n  Evidence: \`${e.evidence}\`` : ''}${e.signature ? `\n  Signature: \`${e.signature}\`` : ''}${e.language ? `\n  Language: ${e.language}` : ''}${e.startLine ? `\n  Lines: ${e.startLine}-${e.endLine}` : ''}`
        ).join('\n')}`
      : '';

    const commitBlock = ranked.commits.length > 0
      ? `\n\n## Relevant commits\n\n${ranked.commits.map(c =>
          `- **${c.message.split('\n')[0]}** — ${c.author}${c.date ? ` (${new Date(c.date.toString()).toLocaleDateString()})` : ''}`
        ).join('\n')}`
      : '';

    const retrievalAnswer = contextIntro + entityBlock + commitBlock;

    const reasoning = await reasonOverGraphContext({
      question,
      retrievalAnswer,
      sources: [...ranked.entities, ...ranked.commits],
    });

    return {
      query: question,
      source: [...ranked.entities, ...ranked.commits],
      answer: reasoning.answer,
      workspaceResponse: formatEngineeringResponse({ question, intent, answer: reasoning.answer, sources: [...ranked.entities, ...ranked.commits], entities: ranked.entities, commits: ranked.commits }),
      reasoning: { available: reasoning.reasoningAvailable, model: reasoning.model, failure: reasoning.reasoningFailure || null },
      latencyMs,
    };
  } finally {
    await session.close();
  }
}
