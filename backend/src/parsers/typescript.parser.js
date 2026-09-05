import { Project } from 'ts-morph';
import path from 'path';
import fs from 'fs';

const SECURITY_RULES = [
  { id: 'hardcoded-secret', severity: 'high', title: 'Possible hard-coded secret', pattern: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]/i },
  { id: 'unsafe-html', severity: 'high', title: 'Unsafe HTML injection sink', pattern: /(?:innerHTML|outerHTML)\s*=/ },
  { id: 'unsafe-html', severity: 'medium', title: 'Raw HTML injection sink', pattern: /dangerouslySetInnerHTML\s*=/ },
  { id: 'dynamic-code', severity: 'high', title: 'Dynamic code execution', pattern: /\beval\s*\(|\bnew Function\s*\(/ },
  { id: 'permissive-cors', severity: 'medium', title: 'Permissive CORS configuration', pattern: /(?:origin|allow_origins)\s*[:=]\s*['\"]\*['\"]/i },
];

function getSecurityFindings(sourceText, fileNode, repoId, orgId) {
  const findings = [];
  const lines = sourceText.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of SECURITY_RULES) {
      if (!rule.pattern.test(line)) continue;
      findings.push({
        id: `${repoId}:${fileNode.path}:security:${rule.id}:${index + 1}`,
        orgId,
        repoId,
        path: fileNode.path,
        name: rule.title,
        type: 'security_finding',
        language: fileNode.language,
        severity: rule.severity,
        description: `Potential ${rule.title.toLowerCase()} detected by the ${rule.id} rule. Review the surrounding code and its production configuration.`,
        evidence: line.trim().slice(0, 500),
        startLine: index + 1,
        endLine: index + 1,
      });
    }
  });
  return findings;
}

function getSecurityFilesRecursively(dir, baseDir = dir) {
  const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb', '.php']);
  const ignoredDirs = new Set(['node_modules', 'dist', 'build', '.git', '.next', 'coverage', 'out', 'vendor', '.venv', 'venv']);
  let files = [];
  for (const entry of fs.readdirSync(dir)) {
    const filePath = path.join(dir, entry);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!ignoredDirs.has(entry)) files = files.concat(getSecurityFilesRecursively(filePath, baseDir));
    } else if (supportedExtensions.has(path.extname(entry))) {
      files.push(filePath);
    }
  }
  return files;
}

/**
 * Recursively gets all TS/JS files in a directory (excluding common ignore folders)
 */
function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  const ignoredDirs = new Set(['node_modules', 'dist', 'build', '.git', '.next', 'coverage', 'out']);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (ignoredDirs.has(file)) continue;
      results = results.concat(getFilesRecursively(filePath, baseDir));
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

/**
 * Parses all TypeScript / JavaScript files in the target directory
 */
export function parseDirectory(directoryPath, orgId, repoId) {
  const project = new Project();
  const filePaths = getFilesRecursively(directoryPath);

  filePaths.forEach((fp) => {
    project.addSourceFileAtPath(fp);
  });

  const nodes = [];
  const relationships = [];

  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const absolutePath = sourceFile.getFilePath();
    const relativePath = path.relative(directoryPath, absolutePath).replace(/\\/g, '/');
    const isTs = absolutePath.endsWith('.ts') || absolutePath.endsWith('.tsx');
    const language = isTs ? 'typescript' : 'javascript';

    // 1. Create File Node
    const fileNodeId = `${repoId}:${relativePath}`;
    const fileNode = {
      id: fileNodeId,
      orgId,
      repoId,
      path: relativePath,
      name: path.basename(relativePath),
      type: 'file',
      language,
      startLine: 1,
      endLine: sourceFile.getEndLineNumber(),
    };
    nodes.push(fileNode);

    const securityFindings = getSecurityFindings(sourceFile.getFullText(), fileNode, repoId, orgId);
    for (const finding of securityFindings) {
      nodes.push(finding);
      relationships.push({ fromId: fileNodeId, toId: finding.id, type: 'CONTAINS' });
    }

    // 2. Parse Classes
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      const className = cls.getName();
      if (!className) continue;

      const classNodeId = `${repoId}:${relativePath}:${className}`;
      const classNode = {
        id: classNodeId,
        orgId,
        repoId,
        path: relativePath,
        name: className,
        type: 'class',
        language,
        signature: `class ${className}`,
        startLine: cls.getStartLineNumber(),
        endLine: cls.getEndLineNumber(),
      };
      nodes.push(classNode);

      // File CONTAINS Class
      relationships.push({
        fromId: fileNodeId,
        toId: classNodeId,
        type: 'CONTAINS',
      });

      // Parse Methods inside class
      const methods = cls.getMethods();
      for (const method of methods) {
        const methodName = method.getName();
        const methodNodeId = `${repoId}:${relativePath}:${className}:${methodName}`;
        const methodNode = {
          id: methodNodeId,
          orgId,
          repoId,
          path: relativePath,
          name: methodName,
          type: 'method',
          language,
          signature: method.getStructure().name + method.getParameters().map(p => p.getText()).join(', '),
          startLine: method.getStartLineNumber(),
          endLine: method.getEndLineNumber(),
        };
        nodes.push(methodNode);

        // Class CONTAINS Method
        relationships.push({
          fromId: classNodeId,
          toId: methodNodeId,
          type: 'CONTAINS',
        });
      }
    }

    // 3. Parse Standalone Functions
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      const funcName = func.getName();
      if (!funcName) continue;

      const funcNodeId = `${repoId}:${relativePath}:${funcName}`;
      const funcNode = {
        id: funcNodeId,
        orgId,
        repoId,
        path: relativePath,
        name: funcName,
        type: 'function',
        language,
        signature: func.getStructure().name + func.getParameters().map(p => p.getText()).join(', '),
        startLine: func.getStartLineNumber(),
        endLine: func.getEndLineNumber(),
      };
      nodes.push(funcNode);

      // File CONTAINS Function
      relationships.push({
        fromId: fileNodeId,
        toId: funcNodeId,
        type: 'CONTAINS',
      });
    }

    // 4. Parse Interfaces
    const interfaces = sourceFile.getInterfaces();
    for (const interf of interfaces) {
      const interfName = interf.getName();
      const interfNodeId = `${repoId}:${relativePath}:${interfName}`;
      const interfNode = {
        id: interfNodeId,
        orgId,
        repoId,
        path: relativePath,
        name: interfName,
        type: 'interface',
        language,
        signature: `interface ${interfName}`,
        startLine: interf.getStartLineNumber(),
        endLine: interf.getEndLineNumber(),
      };
      nodes.push(interfNode);

      // File CONTAINS Interface
      relationships.push({
        fromId: fileNodeId,
        toId: interfNodeId,
        type: 'CONTAINS',
      });
    }

    // 5. Parse Imports to establish file-to-file DEPENDS_ON relationship
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('@/')) {
        let targetRelativePath = '';

        if (moduleSpecifier.startsWith('.')) {
          const sourceDir = path.dirname(relativePath);
          const resolved = path.normalize(path.join(sourceDir, moduleSpecifier)).replace(/\\/g, '/');
          targetRelativePath = resolved;
        } else {
          targetRelativePath = moduleSpecifier.replace(/^@\//, 'src/');
        }

        const targetPathFull = path.join(directoryPath, targetRelativePath);
        const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
        let matchedTargetId = null;

        for (const ext of possibleExtensions) {
          const testPath = targetRelativePath + ext;
          const testFullPath = targetPathFull + ext;
          if (fs.existsSync(testFullPath)) {
            matchedTargetId = `${repoId}:${testPath}`;
            break;
          }
        }

        if (matchedTargetId) {
          relationships.push({
            fromId: fileNodeId,
            toId: matchedTargetId,
            type: 'DEPENDS_ON',
            metadata: { type: 'import', specifier: moduleSpecifier },
          });
        }
      }
    }
  }

  // The AST graph currently models JS/TS only. Scan other common source files so
  // a security query still covers the whole imported repository.
  const existingFilePaths = new Set(nodes.filter((node) => node.type === 'file').map((node) => node.path));
  for (const absolutePath of getSecurityFilesRecursively(directoryPath)) {
    const relativePath = path.relative(directoryPath, absolutePath).replace(/\\/g, '/');
    if (existingFilePaths.has(relativePath)) continue;
    const extension = path.extname(absolutePath).slice(1);
    const fileNode = {
      id: `${repoId}:${relativePath}`,
      orgId,
      repoId,
      path: relativePath,
      name: path.basename(relativePath),
      type: 'file',
      language: extension || 'unknown',
      startLine: 1,
      endLine: fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/).length,
    };
    nodes.push(fileNode);
    for (const finding of getSecurityFindings(fs.readFileSync(absolutePath, 'utf8'), fileNode, repoId, orgId)) {
      nodes.push(finding);
      relationships.push({ fromId: fileNode.id, toId: finding.id, type: 'CONTAINS' });
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const validRelationships = relationships.filter((rel) => {
    if (nodeIds.has(rel.toId)) return true;

    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      if (nodeIds.has(rel.toId + ext)) {
        rel.toId = rel.toId + ext;
        return true;
      }
    }
    for (const index of ['/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
      if (nodeIds.has(rel.toId + index)) {
        rel.toId = rel.toId + index;
        return true;
      }
    }
    return false;
  });

  return {
    nodes,
    relationships: validRelationships,
  };
}
