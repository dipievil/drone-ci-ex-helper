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
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const YAML = __importStar(require("yaml"));
const ajv_1 = __importDefault(require("ajv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Create a connection for the server
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let droneSchema;
let ajv;
let validateSchema;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            },
            hoverProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
    // Load the Drone CI schema
    loadDroneSchema();
});
function loadDroneSchema() {
    try {
        const schemaPath = path.join(__dirname, '../../schemas/drone-schema.json');
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        droneSchema = JSON.parse(schemaContent);
        ajv = new ajv_1.default({ allErrors: true, strict: false });
        validateSchema = ajv.compile(droneSchema);
        connection.console.log('Drone CI schema loaded successfully');
    }
    catch (error) {
        connection.console.error(`Failed to load Drone CI schema: ${error}`);
    }
}
// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings = {
    validation: {
        enabled: true,
        schemaSource: 'bundled'
    }
};
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.droneCI || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'droneCI'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});
async function validateTextDocument(textDocument) {
    const settings = await getDocumentSettings(textDocument.uri);
    if (!settings.validation.enabled) {
        return;
    }
    const text = textDocument.getText();
    const diagnostics = [];
    try {
        // Parse YAML
        const doc = YAML.parseDocument(text);
        if (doc.errors.length > 0) {
            for (const error of doc.errors) {
                const diagnostic = {
                    severity: node_1.DiagnosticSeverity.Error,
                    range: {
                        start: textDocument.positionAt(error.pos?.[0] || 0),
                        end: textDocument.positionAt(error.pos?.[1] || 0)
                    },
                    message: error.message,
                    source: 'Drone CI'
                };
                diagnostics.push(diagnostic);
            }
        }
        else if (validateSchema) {
            // Validate against schema
            const yamlObj = doc.toJSON();
            const valid = validateSchema(yamlObj);
            if (!valid && validateSchema.errors) {
                for (const error of validateSchema.errors) {
                    const errorPath = error.instancePath || '/';
                    const message = `${errorPath}: ${error.message}`;
                    const diagnostic = {
                        severity: node_1.DiagnosticSeverity.Error,
                        range: {
                            start: { line: 0, character: 0 },
                            end: { line: 0, character: 0 }
                        },
                        message: message,
                        source: 'Drone CI Schema'
                    };
                    if (hasDiagnosticRelatedInformationCapability) {
                        diagnostic.relatedInformation = [
                            {
                                location: {
                                    uri: textDocument.uri,
                                    range: Object.assign({}, diagnostic.range)
                                },
                                message: error.keyword || 'Validation error'
                            }
                        ];
                    }
                    diagnostics.push(diagnostic);
                }
            }
        }
    }
    catch (e) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: Number.MAX_VALUE }
            },
            message: `Failed to parse YAML: ${e}`,
            source: 'Drone CI'
        };
        diagnostics.push(diagnostic);
    }
    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});
// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition) => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested.
    return getDroneCompletions(_textDocumentPosition);
});
function getDroneCompletions(params) {
    const completions = [];
    // Add common Drone CI properties
    const droneProperties = [
        { label: 'kind', detail: 'Pipeline kind', kind: node_1.CompletionItemKind.Property },
        { label: 'type', detail: 'Pipeline type', kind: node_1.CompletionItemKind.Property },
        { label: 'name', detail: 'Pipeline name', kind: node_1.CompletionItemKind.Property },
        { label: 'steps', detail: 'Pipeline steps', kind: node_1.CompletionItemKind.Property },
        { label: 'trigger', detail: 'Pipeline trigger', kind: node_1.CompletionItemKind.Property },
        { label: 'image', detail: 'Docker image', kind: node_1.CompletionItemKind.Property },
        { label: 'commands', detail: 'Shell commands', kind: node_1.CompletionItemKind.Property },
        { label: 'services', detail: 'Services', kind: node_1.CompletionItemKind.Property },
        { label: 'volumes', detail: 'Volumes', kind: node_1.CompletionItemKind.Property },
        { label: 'environment', detail: 'Environment variables', kind: node_1.CompletionItemKind.Property },
        { label: 'when', detail: 'Conditional execution', kind: node_1.CompletionItemKind.Property },
        { label: 'depends_on', detail: 'Dependencies', kind: node_1.CompletionItemKind.Property },
        { label: 'platform', detail: 'Platform settings', kind: node_1.CompletionItemKind.Property },
        { label: 'clone', detail: 'Clone settings', kind: node_1.CompletionItemKind.Property },
        { label: 'workspace', detail: 'Workspace settings', kind: node_1.CompletionItemKind.Property }
    ];
    droneProperties.forEach(prop => {
        completions.push({
            label: prop.label,
            kind: prop.kind,
            detail: prop.detail,
            data: prop.label
        });
    });
    return completions;
}
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (droneSchema && droneSchema.properties && droneSchema.properties[item.data]) {
        const propSchema = droneSchema.properties[item.data];
        if (propSchema.description) {
            item.documentation = propSchema.description;
        }
    }
    return item;
});
// Hover provider
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }
    const text = document.getText();
    const offset = document.offsetAt(params.position);
    const line = text.split('\n')[params.position.line];
    // Simple key extraction (looking for YAML keys)
    const keyMatch = line.match(/^\s*(\w+):/);
    if (keyMatch && droneSchema && droneSchema.properties) {
        const key = keyMatch[1];
        const propSchema = droneSchema.properties[key];
        if (propSchema) {
            let hoverText = `**${key}**\n\n`;
            if (propSchema.description) {
                hoverText += `${propSchema.description}\n\n`;
            }
            if (propSchema.type) {
                hoverText += `Type: \`${propSchema.type}\`\n\n`;
            }
            if (propSchema.enum) {
                hoverText += `Valid values: ${propSchema.enum.map((v) => `\`${v}\``).join(', ')}\n\n`;
            }
            hoverText += `[Drone CI Documentation](https://docs.drone.io/)`;
            return {
                contents: {
                    kind: node_1.MarkupKind.Markdown,
                    value: hoverText
                }
            };
        }
    }
    return null;
});
// Custom validation notification handler
connection.onNotification('droneCI/validate', async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (document) {
        await validateTextDocument(document);
    }
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map