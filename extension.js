// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')
const YAML = require('yaml')
const SwaggerParser = require("swagger-parser")

function preCheck(parsed, doc) {
	const pre = {
		fileName: doc.fileName
	}
	let result = ''
	const regex = /^3\.0\.\d(-.+)?$/
	if (parsed) {
		if (parsed.swagger && parsed.swagger !== "2.0") {
			result+='SyntaxError: Unrecognized Swagger version. Expected 2.0 (also must of String type\n'
		} else if (parsed.openapi && !regex.test(parsed.openapi)) {
			result+='SyntaxError: Unsupported OpenAPI version. Swagger Parser only supports OpenAPI versions =>3.0.0\n'
		}
		
		if (!parsed.info) {
			result+='Missing property "info".\n'
		}
		
		if (!parsed.paths) {
			result+='Missing property "paths".\n'
		}
	}
	pre.message = result
	return pre
}

async function validateSwagger(parsed, doc) {

	try {
		let api = await SwaggerParser.validate(parsed)
		api.fileName = doc.fileName
		return api
	} catch(err) {
		err.fileName = doc.fileName
		return err
	}
}

async function onOpenAndSave(doc) {
	
	if (doc.languageId == "yaml" && doc.uri.scheme === "file") {
		const yamlParsed = YAML.parse(doc.getText())
		if (yamlParsed.swagger || yamlParsed.openapi) {
			let result = preCheck(yamlParsed, doc)
			if (result.message === '') {
				result = await validateSwagger(yamlParsed, doc)
			} 
			return result
		}
	}

	if (doc.languageId == "json" && doc.uri.scheme === "file") {
		const jsonParsed = JSON.parse(doc.getText())
		if (jsonParsed.swagger || jsonParsed.openapi) {
			let result = preCheck(jsonParsed, doc)
			if (result.message === '') {
				result = await validateSwagger(jsonParsed, doc)
			} 
			return result
		}
	}
}

function hover(val, doc, output) {
	
	let message = ''
	if (val.info) {
		message = 
`
${doc.fileName}  
Valid swagger/openapi
`
	} else {
		message = 
`
${doc.fileName}  
${val.message}
`
	}
	output.appendLine('***********')
	output.appendLine(message)
	output.appendLine('***********')
	const hover = vscode.languages.registerHoverProvider(
		doc.languageId,
		{
			provideHover(doc, position) {
				if (val.fileName === doc.fileName && position.line === 0 || position.line === 1) {
					return new vscode.Hover(message)
				}
			}
		}
	)
	hover.fileName = doc.fileName
	return hover
}

function disposeDuplicateHovers(currentHovers, doc) {
	currentHovers.forEach(h => {
		if (h.fileName === doc.fileName) {
			h.dispose()
		}
	})
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	
	//Create output channel
	let output = vscode.window.createOutputChannel("swagger-validator")
	let currentHovers = []

	vscode.workspace.onDidOpenTextDocument(async (doc) => {
		disposeDuplicateHovers(currentHovers, doc)
		let val = await onOpenAndSave(doc)
		currentHovers.push(hover(val, doc, output))
	})

	vscode.workspace.onDidSaveTextDocument(async (doc) => {
		disposeDuplicateHovers(currentHovers, doc)
		let val = await onOpenAndSave(doc)
		currentHovers.push(hover(val, doc, output))
	})
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
