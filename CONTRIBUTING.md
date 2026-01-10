# Contributing to Drone CI Helper

Thank you for your interest in contributing to Drone CI Helper! We welcome contributions from the community.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** - Include sample `.drone.yml` files if relevant
- **Describe the behavior you observed** and **what you expected to see**
- **Include screenshots or animated GIFs** if applicable
- **Provide your environment details**: OS, VS Code version, extension version

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List any similar features** in other editors or extensions

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards below
3. **Add tests** for any new functionality
4. **Ensure all tests pass** by running `npm test`
5. **Update documentation** if needed (README.md, CHANGELOG.md)
6. **Submit a pull request** with a clear description of the changes

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- VS Code (v1.75.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/drone-ci-helper.git
   cd drone-ci-helper
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to open a new window with the extension loaded
3. Create or open a `.drone.yml` file to test the extension
4. Set breakpoints in the code and debug as needed

### Running Tests

Run all tests:
```bash
npm test
```

Run server tests only:
```bash
npm run test:server
```

Run client tests only:
```bash
npm run test:client
```

### Project Structure

```
drone-ci-helper/
├── client/                 # VS Code extension client
│   ├── src/
│   │   ├── extension.ts   # Extension entry point
│   │   └── test/          # Client tests
│   └── package.json
├── server/                 # Language server
│   ├── src/
│   │   ├── server.ts      # LSP server implementation
│   │   └── test/          # Server tests
│   └── package.json
├── schemas/                # Drone CI JSON schema
│   └── drone-schema.json
├── snippets/               # Code snippets
│   └── drone.json
├── syntaxes/               # TextMate grammar
│   └── drone.tmLanguage.json
├── scripts/                # Utility scripts
│   └── update-schema.ts
└── package.json           # Main package manifest
```

## Coding Standards

### TypeScript

- Use TypeScript for all source code
- Follow the existing code style (use ESLint)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let` when possible
- Use async/await over callbacks

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Maximum line length: 100 characters

### Commits

- Use clear and meaningful commit messages
- Follow the format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Example: `feat(autocomplete): add support for plugin suggestions`
- Reference issues in commit messages when applicable

### Testing

- Write unit tests for new functionality
- Ensure tests are descriptive and cover edge cases
- Maintain or improve code coverage
- Test files should mirror the source structure
- Use descriptive test names: `should validate pipeline with triggers`

## Updating the Drone CI Schema

To update the bundled Drone CI schema:

```bash
npm run update-schema
```

This will:
1. Fetch the latest schema from schemastore.org
2. Validate the schema
3. Update the bundled schema file
4. Run tests to ensure compatibility

## Documentation

When adding new features:

- Update [README.md](README.md) with usage examples
- Add entries to [CHANGELOG.md](CHANGELOG.md) under "Unreleased"
- Update JSDoc comments in the code
- Add examples to snippets if applicable

## Release Process

1. Update version in `package.json`
2. Update [CHANGELOG.md](CHANGELOG.md) with release date
3. Commit changes: `chore: release v0.x.0`
4. Create a git tag: `git tag v0.x.0`
5. Push changes and tags: `git push && git push --tags`
6. Package extension: `vsce package`
7. Publish to marketplace: `vsce publish`

## Questions?

Feel free to open an issue for any questions or concerns. We're here to help!

## License

By contributing to Drone CI Helper, you agree that your contributions will be licensed under the MIT License.
