const assert = require('assert')
const path = require('path')
const vscode = require('vscode')
const myExtension = require('../../src/extension')
const context = {
	subscriptions: []
}

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.')
	test('Invalid swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/petstore-no-paths.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(document)
		myExtension.activate(context)
		setTimeout(() => {
			const diags = vscode.languages.getDiagnostics(document.uri)
			assert.deepStrictEqual(diags.length, 2)
		}, 1000)
		
	  myExtension.deactivate()
	})

	test('valid swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/petstore.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(document)
		myExtension.activate(context)
		setTimeout(() => {
			const diags = vscode.languages.getDiagnostics(document.uri)
			assert.deepStrictEqual(diags.length, 0)
		}, 10)
	  myExtension.deactivate()
	})

	test('valid multifile swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/multifile/swagger.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(document)
		myExtension.activate(context)
		setTimeout(() => {
			const diags = vscode.languages.getDiagnostics(document.uri)
			assert.deepStrictEqual(diags.length, 0)
		}, 10)
	  myExtension.deactivate()
	})
})
