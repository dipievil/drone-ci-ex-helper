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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const ajv_1 = __importDefault(require("ajv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Drone Schema Validation', () => {
    let ajv;
    let validateSchema;
    before(() => {
        // Load the schema
        const schemaPath = path.join(__dirname, '../../../schemas/drone-schema.json');
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        const droneSchema = JSON.parse(schemaContent);
        ajv = new ajv_1.default({ allErrors: true, strict: false });
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
//# sourceMappingURL=validation.test.js.map