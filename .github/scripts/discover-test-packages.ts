import fs from 'fs';

const NODE_VERSIONS = [22, 24];

interface MatrixEntry {
  name: string;
  package: string;
  nodeVersion: number;
}

function getMatrix(script: string): string {
  const result: MatrixEntry[] = [];
  for (const dir of ['packages', 'apps']) {
    if (!fs.existsSync(dir)) continue;
    for (const pkg of fs.readdirSync(dir)) {
      const pkgJsonPath = `${dir}/${pkg}/package.json`;
      if (!fs.existsSync(pkgJsonPath)) continue;
      const json = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (json.scripts?.[script]) {
        for (const nodeVersion of NODE_VERSIONS) {
          result.push({ name: pkg, package: json.name, nodeVersion });
        }
      }
    }
  }
  return JSON.stringify({ include: result });
}

const integration = getMatrix('test:integration');
const e2e = getMatrix('test:e2e');

fs.appendFileSync(process.env.GITHUB_OUTPUT!, `integration=${integration}\ne2e=${e2e}\n`);
