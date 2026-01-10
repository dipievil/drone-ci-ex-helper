"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SCHEMA_URL = 'https://www.schemastore.org/drone.json';
const SCHEMA_PATH = path.join(__dirname, '../schemas/drone-schema.json');
/**
 * Fetches the latest Drone CI schema from schemastore.org
 */
function fetchSchema() {
    return new Promise((resolve, reject) => {
        https.get(SCHEMA_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                }
                else {
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
function validateSchema(schemaContent) {
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
    }
    catch (error) {
        console.error('Schema validation failed:', error);
        return false;
    }
}
/**
 * Updates the bundled schema file
 */
function updateSchemaFile(schemaContent) {
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
function updateVersion() {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
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
    }
    catch (error) {
        console.error('❌ Schema update failed:', error);
        process.exit(1);
    }
}
// Run the update
main();
//# sourceMappingURL=update-schema.js.map