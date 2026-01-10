import * as assert from 'assert';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

describe('Drone Schema Validation', () => {
  let ajv: Ajv;
  let validateSchema: any;

  before(() => {
    // Load the schema
    const schemaPath = path.join(process.cwd(), '../schemas/drone-schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const droneSchema = JSON.parse(schemaContent);

    const k8sSchemaPath = path.join(process.cwd(), '../schemas/kubernetes-definitions.json');
    const k8sSchema = JSON.parse(fs.readFileSync(k8sSchemaPath, 'utf-8'));

    ajv = new Ajv({ 
      allErrors: true, 
      strict: false
    });
    ajv.addSchema(k8sSchema);
    validateSchema = ajv.compile(droneSchema);
  });

  it('should validate a simple Docker pipeline', () => {
    const pipeline = {
      kind: 'pipeline',
      type: 'docker',
      name: 'test',
      steps: [
        {
          name: 'build',
          image: 'node:18',
          commands: ['npm install', 'npm test']
        }
      ]
    };

    const valid = validateSchema(pipeline);
    if (!valid) {
      console.log(validateSchema.errors);
    }
    assert.strictEqual(valid, true, 'Simple Docker pipeline should be valid');
  });

  it('should validate a pipeline with triggers', () => {
    const pipeline = {
      kind: 'pipeline',
      type: 'docker',
      name: 'test',
      steps: [
        {
          name: 'build',
          image: 'node:18',
          commands: ['npm test']
        }
      ],
      trigger: {
        branch: ['main'],
        event: ['push', 'pull_request']
      }
    };

    const valid = validateSchema(pipeline);
    if (!valid) {
      console.log(validateSchema.errors);
    }
    assert.strictEqual(valid, true, 'Pipeline with triggers should be valid');
  });

  it('should validate a pipeline with services', () => {
    const pipeline = {
      kind: 'pipeline',
      type: 'docker',
      name: 'test',
      steps: [
        {
          name: 'test',
          image: 'node:18',
          commands: ['npm test']
        }
      ],
      services: [
        {
          name: 'database',
          image: 'postgres:14',
          environment: {
            POSTGRES_USER: 'test',
            POSTGRES_PASSWORD: 'test'
          }
        }
      ]
    };

    const valid = validateSchema(pipeline);
    if (!valid) {
      console.log(validateSchema.errors);
    }
    assert.strictEqual(valid, true, 'Pipeline with services should be valid');
  });

  it('should reject pipeline without required kind field', () => {
    const pipeline = {
      type: 'docker',
      name: 'test',
      steps: []
    };

    const valid = validateSchema(pipeline);
    assert.strictEqual(valid, false, 'Pipeline without kind should be invalid');
  });

  it('should reject pipeline without required steps', () => {
    const pipeline = {
      kind: 'pipeline',
      type: 'docker',
      name: 'test'
    };

    const valid = validateSchema(pipeline);
    assert.strictEqual(valid, false, 'Pipeline without steps should be invalid');
  });
});
