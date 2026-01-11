import * as path from 'path';
import { workspace, ExtensionContext, window, commands } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  console.log('Drone CI Helper extension is now activating!');
  
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  );

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Drone CI YAML files
    documentSelector: [
      { scheme: 'file', language: 'drone-yaml' },
      { scheme: 'file', language: 'yaml', pattern: '**/.drone.yml' },
      { scheme: 'file', pattern: '**/.drone.yml' }
    ],
    synchronize: {
      // Notify the server about file changes to '.drone.yml' files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.drone.yml')
    },
    outputChannelName: 'Drone CI Helper'
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'droneCIHelper',
    'Drone CI Helper',
    serverOptions,
    clientOptions
  );

  // Register commands
  const validateCommand = commands.registerCommand('droneCI.validate', async () => {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage('No active editor found');
      return;
    }

    const document = editor.document;
    const fileName = path.basename(document.fileName);

    if (fileName !== '.drone.yml') {
      window.showErrorMessage('This command only works on .drone.yml files');
      return;
    }

    // Trigger validation by sending a custom notification to the server
    await client.sendNotification('droneCI/validate', {
      textDocument: { uri: document.uri.toString() }
    });

    window.showInformationMessage('Drone CI YAML validation triggered');
  });

  const openDocsCommand = commands.registerCommand('droneCI.openDocs', () => {
    const docsUrl = 'https://docs.drone.io/';
    commands.executeCommand('vscode.open', docsUrl);
  });

  context.subscriptions.push(validateCommand, openDocsCommand);

  // Start the client. This will also launch the server
  client.start();
  
  console.log('Drone CI Helper Language Client started!');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
