const vscode = require('vscode')
const apiWords = ['swagger', '"swagger"', 'openapi', '"openapi"']

/**
 * Analyzes the text document for problems. 
 * This demo diagnostic problem provider finds all mentions of keyword.
 * @param doc text document to analyze
 * @param docDiagnostics diagnostic collection
 * @param message diagnostic message
 */
function refreshDiagnostics(doc, docDiagnostics, message) {
	const diagnostics = []
	if (message !== 'Valid') {
		let apiWord
		for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
			const lineOfText = doc.lineAt(lineIndex)
			for (let word = 0; word < apiWords.length; word++) {
				if (lineOfText.text.includes(apiWords[word])) {
					apiWord = apiWords[word]
					diagnostics.push(createDiagnostic(lineOfText, lineIndex, apiWord, message))
					// If word found break loop
					break
				}
			}
			// If word found break loop
			if (apiWord) {
				break
			}
		}
	}

	docDiagnostics.set(doc.uri, diagnostics)
}

/**
 * Analyzes the text document for problems. 
 * @param lineOfText line word is on
 * @param lineIndex line index value
 * @param word keyword
 * @param message diagnostic message
 */
function createDiagnostic(lineOfText, lineIndex, word, message) {
	const index = lineOfText.text.indexOf(word)
	const range = new vscode.Range(lineIndex, index, lineIndex, index + word.length)
	const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error)
	diagnostic.code = 'swagger-validator'
	return diagnostic
}

module.exports = {
	refreshDiagnostics
}
