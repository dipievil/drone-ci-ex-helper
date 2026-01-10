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
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for Drone CI YAML files
        documentSelector: [
            { scheme: 'file', language: 'drone-yaml' },
            { scheme: 'file', pattern: '**/.drone.yml' }
        ],
        synchronize: {
            // Notify the server about file changes to '.drone.yml' files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.drone.yml')
        }
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('droneCIHelper', 'Drone CI Helper', serverOptions, clientOptions);
    // Register commands
    const validateCommand = vscode_1.commands.registerCommand('droneCI.validate', async () => {
        const editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            vscode_1.window.showErrorMessage('No active editor found');
            return;
        }
        const document = editor.document;
        const fileName = path.basename(document.fileName);
        if (fileName !== '.drone.yml') {
            vscode_1.window.showErrorMessage('This command only works on .drone.yml files');
            return;
        }
        // Trigger validation by sending a custom notification to the server
        await client.sendNotification('droneCI/validate', {
            textDocument: { uri: document.uri.toString() }
        });
        vscode_1.window.showInformationMessage('Drone CI YAML validation triggered');
    });
    const openDocsCommand = vscode_1.commands.registerCommand('droneCI.openDocs', () => {
        const docsUrl = 'https://docs.drone.io/';
        vscode_1.commands.executeCommand('vscode.open', docsUrl);
    });
    context.subscriptions.push(validateCommand, openDocsCommand);
    // Start the client. This will also launch the server
    client.start();
}
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map