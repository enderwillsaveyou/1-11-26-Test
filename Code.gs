/**
 * Command Center v0 - Server-side Google Apps Script
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Command Center v0');
}

function callGemini(userInput) {
  try {
    // Get API key from Script Properties
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

    if (!apiKey) {
      return {
        error: 'GEMINI_API_KEY not found in Script Properties',
        instructions: 'Set it via: File > Project properties > Script properties'
      };
    }

    // Gemini API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // Request payload
    const payload = {
      contents: [{
        parts: [{
          text: userInput
        }]
      }]
    };

    // Make API call
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    // Return raw response
    return {
      statusCode: responseCode,
      response: JSON.parse(responseText)
    };

  } catch (error) {
    return {
      error: error.toString(),
      stack: error.stack
    };
  }
}
