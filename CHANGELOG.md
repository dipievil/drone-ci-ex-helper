# Changelog

All notable changes to the "Drone CI Helper" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Enhanced autocomplete with context-aware suggestions
- Support for multi-document validation
- Integration with Drone CLI
- Advanced schema validation with custom rules
- Support for Drone plugins registry

## [0.1.0] - 2026-01-10

### Added

- Initial release of Drone CI Helper
- Real-time YAML validation against Drone CI schema
- Autocomplete support for Drone CI properties and values
- Hover documentation with property descriptions and types
- Custom syntax highlighting for `.drone.yml` files
- Comprehensive snippet collection for common patterns:
  - Pipeline scaffolding (Docker, Kubernetes, SSH)
  - Step definitions
  - Service configurations
  - Plugin integrations (Docker, Slack, etc.)
  - Trigger and conditional execution
  - Environment variables and secrets
- Extension commands:
  - `Drone CI: Validate YAML` - Manual validation trigger
  - `Drone CI: Open Documentation` - Quick access to docs
- Language Server Protocol implementation
- Bundled Drone CI JSON schema from schemastore.org
- Configuration options for validation and tracing
- TextMate grammar for Drone-specific syntax
- Comprehensive test suite (unit and E2E tests)

### Developer Features

- TypeScript-based LSP client and server
- AJV schema validation
- YAML parsing with error recovery
- VS Code extension packaging configuration
- Debug configuration for extension development

[Unreleased]: https://github.com/yourusername/drone-ci-helper/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/drone-ci-helper/releases/tag/v0.1.0
