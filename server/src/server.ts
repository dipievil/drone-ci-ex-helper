import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  HoverParams,
  Hover,
  MarkupKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import * as YAML from 'yaml';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

let droneSchema: any;
let ajv: Ajv;
let validateSchema: ValidateFunction<any> | undefined;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
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
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
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
    const k8sSchemaPath = path.join(__dirname, '../../schemas/kubernetes-definitions.json');
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const k8sSchemaContent = fs.readFileSync(k8sSchemaPath, 'utf-8');
    
    droneSchema = JSON.parse(schemaContent);
    const k8sSchema = JSON.parse(k8sSchemaContent);

    ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addSchema(k8sSchema);
    validateSchema = ajv.compile(droneSchema);

    connection.console.log('Drone CI schema loaded successfully');
  } catch (error) {
    connection.console.error(`Failed to load Drone CI schema: ${error}`);
  }
}

// The example settings
interface DroneSettings {
  validation: {
    enabled: boolean;
    schemaSource: 'bundled' | 'remote';
  };
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings: DroneSettings = {
  validation: {
    enabled: true,
    schemaSource: 'bundled'
  }
};
let globalSettings: DroneSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<DroneSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <DroneSettings>(
      (change.settings.droneCI || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<DroneSettings> {
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

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);

  if (!settings.validation.enabled) {
    return;
  }

  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  try {
    // Parse YAML
    const doc = YAML.parseDocument(text);

    if (doc.errors.length > 0) {
      for (const error of doc.errors) {
        const diagnostic: Diagnostic = {
          severity: DiagnosticSeverity.Error,
          range: {
            start: textDocument.positionAt(error.pos?.[0] || 0),
            end: textDocument.positionAt(error.pos?.[1] || 0)
          },
          message: error.message,
          source: 'Drone CI'
        };
        diagnostics.push(diagnostic);
      }
    } else if (validateSchema) {
      // Validate against schema
      const yamlObj = doc.toJSON();
      const valid = validateSchema(yamlObj);

      if (!valid && validateSchema.errors) {
        for (const error of validateSchema.errors) {
          const errorPath = error.instancePath || '/';
          const message = `${errorPath}: ${error.message}`;

          const diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Error,
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
  } catch (e) {
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
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
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested.
    return getDroneCompletions(_textDocumentPosition);
  }
);

function getDroneCompletions(params: TextDocumentPositionParams): CompletionItem[] {
  const completions: CompletionItem[] = [];

  // Add common Drone CI properties
  const droneProperties = [
    { label: 'kind', detail: 'Pipeline kind', kind: CompletionItemKind.Property },
    { label: 'type', detail: 'Pipeline type', kind: CompletionItemKind.Property },
    { label: 'name', detail: 'Pipeline name', kind: CompletionItemKind.Property },
    { label: 'steps', detail: 'Pipeline steps', kind: CompletionItemKind.Property },
    { label: 'trigger', detail: 'Pipeline trigger', kind: CompletionItemKind.Property },
    { label: 'image', detail: 'Docker image', kind: CompletionItemKind.Property },
    { label: 'commands', detail: 'Shell commands', kind: CompletionItemKind.Property },
    { label: 'services', detail: 'Services', kind: CompletionItemKind.Property },
    { label: 'volumes', detail: 'Volumes', kind: CompletionItemKind.Property },
    { label: 'environment', detail: 'Environment variables', kind: CompletionItemKind.Property },
    { label: 'when', detail: 'Conditional execution', kind: CompletionItemKind.Property },
    { label: 'depends_on', detail: 'Dependencies', kind: CompletionItemKind.Property },
    { label: 'platform', detail: 'Platform settings', kind: CompletionItemKind.Property },
    { label: 'clone', detail: 'Clone settings', kind: CompletionItemKind.Property },
    { label: 'workspace', detail: 'Workspace settings', kind: CompletionItemKind.Property }
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
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    if (droneSchema && droneSchema.properties && droneSchema.properties[item.data]) {
      const propSchema = droneSchema.properties[item.data];
      if (propSchema.description) {
        item.documentation = propSchema.description;
      }
    }
    return item;
  }
);

// Hover provider
connection.onHover(
  (params: HoverParams): Hover | null => {
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
          hoverText += `Valid values: ${propSchema.enum.map((v: any) => `\`${v}\``).join(', ')}\n\n`;
        }

        hoverText += `[Drone CI Documentation](https://docs.drone.io/)`;

        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: hoverText
          }
        };
      }
    }

    return null;
  }
);

// Custom validation notification handler
connection.onNotification('droneCI/validate', async (params: any) => {
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
