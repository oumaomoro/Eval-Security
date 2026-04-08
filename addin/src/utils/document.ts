/// <reference types="office-js" />

/**
 * Extracts all the plain text from the active MS Word Document.
 */
export async function getDocumentText(): Promise<string> {
  return new Promise((resolve, reject) => {
    Word.run(async (context) => {
      // Get the entire document body
      const body = context.document.body;
      
      // We must load the text property before reading it
      body.load("text");
      
      // Synchronize the Document state
      await context.sync();
      
      resolve(body.text);
    }).catch((error) => {
      console.error("Error reading Word Document context:", error);
      reject(error);
    });
  });
}

/**
 * Inserts an AI Suggestion Comment securely into the document
 */
export async function insertComment(textToCommentOn: string, commentText: string) {
    Word.run(async (context) => {
        const body = context.document.body;
        const searchResults = body.search(textToCommentOn, { matchCase: false, matchWholeWord: true });
        
        searchResults.load("length");
        await context.sync();

        if (searchResults.items.length > 0) {
            const firstMatch = searchResults.items[0];
            firstMatch.insertComment(commentText);
        }
        await context.sync();
    }).catch(console.error);
}
