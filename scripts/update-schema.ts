import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_URL = 'https://www.schemastore.org/drone.json';
const SCHEMA_PATH = path.join(__dirname, '../schemas/drone-schema.json');

interface PackageJson {
  version: string;
  [key: string]: any;
}

/**
 * Fetches the latest Drone CI schema from schemastore.org
 */
function fetchSchema(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(SCHEMA_URL, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch schema: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Validates the schema is valid JSON
 */
function validateSchema(schemaContent: string): boolean {
  try {
    const schema = JSON.parse(schemaContent);
    
    // Basic validation checks
    if (!schema.$schema) {
      console.error('Schema missing $schema property');
      return false;
    }
    
    if (!schema.definitions && !schema.properties) {
      console.error('Schema missing definitions or properties');
      return false;
    }
    
    console.log('✓ Schema validation passed');
    return true;
  } catch (error) {
    console.error('Schema validation failed:', error);
    return false;
  }
}

/**
 * Updates the bundled schema file
 */
function updateSchemaFile(schemaContent: string): void {
  // Ensure the schemas directory exists
  const schemasDir = path.dirname(SCHEMA_PATH);
  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }

  // Write the schema file with pretty formatting
  const schema = JSON.parse(schemaContent);
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2), 'utf-8');
  console.log(`✓ Schema updated at ${SCHEMA_PATH}`);
}

/**
 * Updates the patch version in package.json
 */
function updateVersion(): void {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const versionParts = packageJson.version.split('.');
  const major = parseInt(versionParts[0]);
  const minor = parseInt(versionParts[1]);
  const patch = parseInt(versionParts[2]) + 1;
  
  packageJson.version = `${major}.${minor}.${patch}`;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  console.log(`✓ Version updated to ${packageJson.version}`);
}

/**
 * Main update process
 */
async function main() {
  try {
    console.log('Fetching latest Drone CI schema from schemastore.org...');
    const schemaContent = await fetchSchema();
    
    console.log('Validating schema...');
    if (!validateSchema(schemaContent)) {
      console.error('❌ Schema validation failed');
      process.exit(1);
    }
    
    console.log('Updating bundled schema...');
    updateSchemaFile(schemaContent);
    
    console.log('Updating version...');
    updateVersion();
    
    console.log('\n✓ Schema update completed successfully!');
    console.log('Next steps:');
    console.log('  1. Run tests: npm test');
    console.log('  2. Review changes: git diff');
    console.log('  3. Commit: git add . && git commit -m "chore: update Drone CI schema"');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

// Run the update
main();
