# Drone CI Helper - AI Coding Agent Instructions

This VS Code extension provides comprehensive Drone CI YAML support through a Language Server Protocol (LSP) architecture. These instructions help AI agents work effectively with this codebase.

## Architecture Overview

**LSP Client/Server Design**: The extension uses a split architecture with:
- `client/` - VS Code extension client (`client/src/extension.ts`)
- `server/` - Language server implementation (`server/src/server.ts`)
- Communication via LSP over IPC transport

**Key Components**:
- Schema validation using AJV with bundled Drone CI schema (`schemas/drone-schema.json`)
- TextMate grammar for syntax highlighting (`syntaxes/drone.tmLanguage.json`)
- Code snippets collection (`snippets/drone.json`)
- Schema update mechanism (`scripts/update-schema.ts`)

## Development Workflows

**Building & Testing**:
```bash
npm run compile          # Compile TypeScript (both client/server)
npm run watch           # Watch mode compilation
npm test               # Run all tests (client + server)
npm run test:server    # Server-only tests
npm run test:client    # Client-only tests
```

**Debugging**:
- Use "Client + Server" compound launch configuration in `.vscode/launch.json`
- Server debug port: 6009 (configured in `client/src/extension.ts`)
- Client runs in Extension Host, server attaches via Node inspector

**Schema Updates**:
```bash
npm run update-schema   # Fetch latest schema from schemastore.org
```

## Project-Specific Patterns

**LSP Server Structure**:
- Schema loading occurs in `onInitialized()` callback
- Validation happens on document change via `validateTextDocument()`
- Completion items use schema-driven property suggestions
- Hover provider extracts YAML keys with regex: `/^\s*(\w+):/`

**Configuration Management**:
- Settings namespace: `droneCI.*` (see `package.json` contributes.configuration)
- Document-specific settings cached in `documentSettings` Map
- Fallback to `globalSettings` when workspace configuration unavailable

**File Associations**:
- Custom language ID: `drone-yaml` for `.drone.yml` files
- Document selectors: `{ scheme: 'file', pattern: '**/.drone.yml' }`
- FileSystemWatcher monitors changes to `.drone.yml`

## Testing Approach

**Server Tests** (`server/src/test/validation.test.ts`):
- Direct AJV schema validation against pipeline objects
- Test cases for Docker, triggers, services configurations
- Validation failure scenarios (missing required fields)

**Client Tests** (`client/src/test/suite/extension.test.ts`):
- Extension activation and command registration verification
- Uses `@vscode/test-electron` for E2E testing

## Code Organization

**Snippet Structure**: Each snippet in `snippets/drone.json` has prefix (trigger), body (template), and description. Use placeholders like `${1:default}` for tab stops.

**TextMate Grammar**: Scopes follow `source.drone-yaml` with patterns for keywords, values, and YAML base syntax. Keywords use lookbehind assertions for context-aware highlighting.

**Error Handling**: Server catches schema validation errors and YAML parse errors, converting them to LSP Diagnostics with appropriate severity levels.

**Dependencies**:
- `ajv` for JSON schema validation
- `yaml` library for parsing (not js-yaml)
- `vscode-languageserver*` packages for LSP implementation

## Schema Integration

The Drone schema (`schemas/drone-schema.json`) is bundled and loaded at server startup. The schema defines pipeline types (docker, kubernetes, ssh, exec, etc.) with allOf/oneOf patterns. Key properties are extracted for autocomplete suggestions in `getDroneCompletions()`.

When modifying schema-related code, ensure `loadDroneSchema()` error handling accounts for missing files during development.