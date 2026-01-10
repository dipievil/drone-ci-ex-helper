# Drone CI Helper

A powerful VS Code extension for working with Drone CI YAML files, providing validation, autocomplete, documentation, and snippets.

## Features

### ✨ Real-time YAML Validation
- Automatic validation against the official Drone CI JSON schema
- Inline error messages and diagnostics
- Schema validation from schemastore.org

### 🔍 Intelligent Autocomplete
- Context-aware suggestions for Drone CI properties
- Completion for pipeline types, triggers, and configurations
- Enum value suggestions for fields like `kind`, `type`, and `event`

### 📖 Hover Documentation
- Inline documentation for Drone CI properties
- Property types and valid values
- Direct links to official Drone CI documentation

### 🎨 Syntax Highlighting
- Custom TextMate grammar for Drone CI YAML
- Highlighting for Drone-specific keywords and values
- Better readability for `.drone.yml` files

### 📝 Code Snippets
- Comprehensive snippet collection for common patterns
- Snippets for pipelines, steps, services, and plugins
- Quick scaffolding for Docker, Kubernetes, and other pipeline types

### ⚡ Commands
- **Drone CI: Validate YAML** - Manually trigger validation for `.drone.yml` files
- **Drone CI: Open Documentation** - Quick access to Drone CI documentation

## Installation

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P` to open Quick Open
3. Type `ext install drone-ci-helper`
4. Press Enter

## Usage

### Basic Setup

1. Create or open a `.drone.yml` file in your workspace
2. The extension will automatically activate and provide features
3. Start typing to see autocomplete suggestions
4. Hover over properties to see documentation

### Available Snippets

Type these prefixes and press `Tab` to insert:

- `drone-pipeline` - Basic Drone CI pipeline
- `drone-pipeline-docker` - Complete Docker pipeline with triggers
- `drone-pipeline-kubernetes` - Kubernetes pipeline
- `drone-step` - Pipeline step
- `drone-service` - Service definition
- `drone-plugin` - Generic plugin step
- `drone-plugin-docker` - Docker build and push plugin
- `drone-plugin-slack` - Slack notification plugin
- `drone-trigger` - Pipeline trigger
- `drone-when` - Conditional execution
- `drone-environment` - Environment variables
- `drone-volume` - Volume mount
- `drone-secret` - Secret definition

### Example Pipeline

```yaml
kind: pipeline
type: docker
name: default

steps:
  - name: build
    image: node:18
    commands:
      - npm install
      - npm run build

  - name: test
    image: node:18
    commands:
      - npm test

trigger:
  branch:
    - main
  event:
    - push
    - pull_request
```

## Extension Settings

This extension contributes the following settings:

- `droneCI.validation.enabled`: Enable/disable Drone CI YAML validation (default: `true`)
- `droneCI.validation.schemaSource`: Use bundled schema or fetch from schemastore.org (default: `bundled`)
- `droneCI.trace.server`: Traces the communication between VS Code and the language server (default: `off`)

## Requirements

- VS Code 1.75.0 or higher

## Known Issues

Please report issues on the [GitHub repository](https://github.com/yourusername/drone-ci-helper/issues).

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.1.0

Initial release of Drone CI Helper:
- Real-time YAML validation
- Autocomplete support
- Hover documentation
- Syntax highlighting
- Code snippets
- Validation and documentation commands

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This extension is licensed under the MIT License.

## Acknowledgments

- Drone CI schema from [SchemaStore](https://www.schemastore.org/)
- Built with the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)

---

**Enjoy using Drone CI Helper!** 🚀


- Syntax highlighting for `.drone.yml` files.
- Snippets for common Drone CI configurations.
- Validation of Drone CI YAML syntax.
- Integration with Drone CI documentation for quick reference.

## Installation

1. Open VSCode.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
3. Search for "Drone CI Helper".
4. Click "Install" to add the extension to your VSCode.

## Usage

1. Open a `.drone.yml` file in VSCode.
2. Use the provided snippets by typing the prefix and pressing `Tab`.
3. Hover over syntax elements to see validation messages, suggestions and examples.
4. Hover over red marked lines to see validation errors and suggestions.
5. Validate your Drone CI configuration by running the command `Drone CI: Validate YAML` from the Command Palette (`Ctrl+Shift+P`).
6. Access Drone CI documentation by running the command `Drone CI: Open Documentation` from the Command Palette.
7. Customize settings by going to `File > Preferences > Settings` and searching for "Drone CI".