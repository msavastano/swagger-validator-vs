const vscode = require('vscode')
const YAML = require('yaml')
const SwaggerParser = require("swagger-parser")

/**
 * Add extra clarity to basic valdation errors that swagger-cli does not provide
 * @param {Object} parsed YAML or JSON parsed
 * @param {Object} doc vscode document object
 */
function preCheck(parsed, doc) {
	const pre = {
		fileName: doc.fileName
	}
	let result = ''
	const regex = /^3\.0\.\d(-.+)?$/
	if (parsed) {
		if (parsed.swagger && parsed.swagger !== "2.0") {
			result+='SyntaxError: Unrecognized Swagger version. Expected 2.0 (also must be String type)\n'
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

/**
 * Validation
 * @param {Object} doc vscode document object
 */
async function validateSwagger(doc) {
	let api
	let deref
	try {
		// Multifile specs need dereference bundle or won't find other files
		deref = await SwaggerParser.dereference(doc.fileName)
		api = await SwaggerParser.validate(deref)
		api.fileName = doc.fileName
		return api
	} catch(err) {
		err.fileName = doc.fileName
		return err
	}
}

/**
 * Actions to take on opening and saving documents
 * @param {Object} doc vscode document object
 */
async function onOpenAndSave(doc) {
	if ((doc.languageId == "yaml" || doc.languageId == "json") && doc.uri.scheme === "file") {
		let parse
		if (doc.languageId == "yaml") {
			parse = YAML.parse(doc.getText())
		} else {
			parse = JSON.parse(doc.getText())
		}
		if (parse.swagger || parse.openapi) {
			let result = preCheck(parse, doc)
			if (result.message === '') {
				result = await validateSwagger(doc)
			} 
			return result
		}
	}
}

/**
 * Create and register the hover object
 * @param {Object} val Validation results
 * @param {Object} doc vscode document object
 * @param {Function} output function to add to extension output log
 */
function hover(val, doc, output) {
	
	let message = ''
	if (val.info) {
		message = 
`
${doc.fileName}  
Valid swagger/openapi  
-------------
`
	} else {
		message = 
`
${doc.fileName}  
${val.message}
-------------
`
	}
	output.appendLine(message)
	const hoverWords = ['swagger', '"swagger"', 'openapi', '"openapi"']
	const hov = vscode.languages.registerHoverProvider(
		doc.languageId,
		{
			provideHover(doc, position) {
				const range = doc.getWordRangeAtPosition(position)
				const word = doc.getText(range)
				if (val.fileName === doc.fileName && hoverWords.includes(word)) {
					return new vscode.Hover(message)
				}
			}
		}
	)
	hov.fileName = doc.fileName
	return hov
}

/**
 * 
 * @param {Array} currentHovers list of hovers
 * @param {Object} doc vscode document object
 */
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
		if(val) {
			currentHovers.push(hover(val, doc, output))
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (doc) => {
		disposeDuplicateHovers(currentHovers, doc)
		let val = await onOpenAndSave(doc)
		if(val) {
			currentHovers.push(hover(val, doc, output))
		}
	})
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}