import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('drone-ci-helper.drone-ci-helper'));
  });

  test('Should register droneCI.validate command', async () => {
    const ext = vscode.extensions.getExtension('drone-ci-helper.drone-ci-helper');
    await ext?.activate();
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('droneCI.validate'));
  });

  test('Should register droneCI.openDocs command', async () => {
    const ext = vscode.extensions.getExtension('drone-ci-helper.drone-ci-helper');
    await ext?.activate();
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('droneCI.openDocs'));
  });
});
