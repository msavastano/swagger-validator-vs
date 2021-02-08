const assert = require('assert')
const path = require('path')
const vscode = require('vscode')
let outputTest = vscode.window.createOutputChannel("swagger-validator-test")

const myExtension = require('../../src/extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('extension activate and deactivates', async function () {
		myExtension.activate()
		myExtension.deactivate()
	})
	
	test('valid swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/petstore.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const result = await myExtension.onOpenAndSave(document)
		assert.strictEqual(result.message, undefined)
		const hover = myExtension.hover(result, document, outputTest)
		assert.ok(hover)
	});

	test('invalid swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/petstore-no-info-title.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const result = await myExtension.onOpenAndSave(document)
		assert.ok(result.message.includes('Missing required property: title at #/info'))
		const hover = myExtension.hover(result, document, outputTest)
		assert.ok(hover)
	});

	test('valid multifile swagger', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/multifile/swagger.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const result = await myExtension.onOpenAndSave(document)
		assert.strictEqual(result.message, undefined)
		const hover = myExtension.hover(result, document, outputTest)
		assert.ok(hover)
	});

	test('invalid precheck', async function () {
		const uri = vscode.Uri.file(
			path.join(__dirname +  '/testFiles/petstore-no-paths.yaml')
		)
		const document = await vscode.workspace.openTextDocument(uri)
		const result = await myExtension.onOpenAndSave(document)
		assert.ok(result.message.includes('Missing property "paths"'))
		const hover = myExtension.hover(result, document, outputTest)
		assert.ok(hover)
	});
});
