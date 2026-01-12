/** Code.gs — Command Center v0 (Apps Script + Gemini 1.5 Flash) **/
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Command Center v0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function processInput(text) {
  try {
    const cleaned = (text || '').toString().trim();
    if (!cleaned) {
      return { error: true, message: "Empty input. Please type or dictate something." };
    }
    const parsedResponse = callGemini(cleaned);
    return parsedResponse;
  } catch (err) {
    return { error: true, message: "Server error in processInput().", details: String(err) };
  }
}

function listModels() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return "No API key";
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models';
  const options = {
    method: 'get',
    muteHttpExceptions: true,
    headers: { 'x-goog-api-key': apiKey }
  };

  const resp = UrlFetchApp.fetch(url, options);
  return resp.getContentText();
}

function callGemini(userText) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return { error: true, message: "Missing GEMINI_API_KEY in Script Properties." };
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  const systemInstruction = "Return ONLY valid JSON. Do not use markdown. " +
    "Schema: summary (string), tasks (array), calendar_events (array), research_questions (array), coding_tickets (array), uncertainty_or_refusal (object/null).";

  const payload = {
    contents: [{
      role: "user",
      parts: [{ text: systemInstruction + "\n\nUser input:\n" + userText }]
    }],
    generationConfig: {
      temperature: 0.2
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload)
  };

  const resp = UrlFetchApp.fetch(url, options);
  const status = resp.getResponseCode();
  const raw = resp.getContentText();

  if (status < 200 || status >= 300) {
    const errorObj = {
      error: true,
      message: "Gemini API call failed.",
      http_status: status,
      raw_response: raw
    };

    if (status === 404) {
      errorObj.available_models = listModels();
    }

    return errorObj;
  }

  let envelope = JSON.parse(raw);
  const textOut = envelope.candidates[0].content.parts[0].text;

  try {
    return JSON.parse(textOut);
  } catch (e) {
    return { error: true, message: "Model output was not valid JSON.", raw_model_text: textOut };
  }
}
