const Tesseract = require('tesseract.js');
const { generateText } = require('../config/ai');
const ApiError = require('../utils/ApiError');

const runTesseract = async (imageBuffer) => {
  const startTime = Date.now();
  try {
    const { data } = await Tesseract.recognize(imageBuffer, 'eng+hin', {
      logger: () => {},
    });
    return {
      text:       data.text || '',
      confidence: data.confidence || 0,
      timeMs:     Date.now() - startTime,
    };
  } catch (error) {
    throw new ApiError(422, 'Could not read text from image: ' + error.message);
  }
};

const processWithGemini = async (rawOcrText) => {
  const prompt = `
You are an expert OCR correction AI specializing in Indian government documents (Aadhaar, PAN card, land records, Application, court notices, voter ID, ration card, certificates, etc).

I will give you raw OCR text that was extracted from a scanned document. The text may be:
- Very Blurry, Very Small, Crumpled or low resolution
- Partially garbled with wrong characters
- Mixed Hindi/English
- Have broken words or extra spaces

YOUR TASKS:
Act as a high-powered OCR system. If the text or sections of the image are small, faint, or hard to read, digitally zoom in and enhance your focus on those specific areas to extract maximum detail.

1. Even if the text is Very blurry, Very Small Crumpled or partially garbled — DO YOUR BEST to extract whatever information is visible. Never give up.
2. Fix OCR errors using your knowledge of Indian document formats
3. Detect languages used (hindi, english, tamil, telugu, marathi, gujarati, kannada, bengali, punjabi, etc)
4. Identify document type
5. Extract ALL visible fields — name, dob, id numbers, address, father name, gender, pincode, etc
6. Flag PII fields (aadhaar_number, pan_number, phone, address, dob)
7. Write correctedText as clean, human-readable paragraphs — NOT raw OCR dump. Format it nicely with proper line breaks and labels.
8. Give confidenceScore:
   - Even blurry/partial text should score 55-70 (something was extracted)
   - Clear text scores 80-99
   - Only give below 50 if NOTHING could be read at all
9. Give healthScore for image quality

IMPORTANT RULES:
- correctedText must be FORMATTED and READABLE — like a proper document summary with labels
- Example correctedText format:
  "Document Type: Aadhaar Card

   Name: Rajesh Kumar
   Date of Birth: 15/08/1985
   Gender: Male
   Aadhaar Number: 1234 5678 9012

   Address: 123 Gandhi Nagar, New Delhi - 110001

   Issued by: Government of India"
- extractedFields must list every piece of data you found
- ONLY return valid JSON — no markdown, no extra text

JSON format:
{
  "detectedLanguages": ["english", "hindi"],
  "primaryLanguage": "english",
  "correctedText": "formatted readable text here",
  "documentType": "aadhaar",
  "extractedFields": [
    { "key": "name",           "value": "Rajesh Kumar",       "confidence": 92, "isPII": false },
    { "key": "dob",            "value": "15/08/1985",          "confidence": 88, "isPII": true  },
    { "key": "aadhaar_number", "value": "1234 5678 9012",      "confidence": 95, "isPII": true  },
    { "key": "address",        "value": "123 Gandhi Nagar",    "confidence": 75, "isPII": true  }
  ],
  "piiFields": ["dob", "aadhaar_number", "address"],
  "hasPII": true,
  "structuredContent": { "title": "GOVERNMENT OF INDIA", "sections": [] },
  "confidenceScore": 82,
  "healthScore": 70,
  "healthDetails": {
    "clarity":      65,
    "completeness": 80,
    "readability":  75,
    "suggestions":  ["Image is slightly blurry — try uploading a clearer scan for better results"]
  }
}

Document types: aadhaar, pan, voter_id, passport, driving_license, land_record, court_notice, ration_card, birth_certificate, school_certificate, income_certificate, caste_certificate, medical_record, bank_statement, legal_notice, other

RAW OCR TEXT TO ANALYZE:
${rawOcrText}
`;

  try {
    const rawResponse = await generateText(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return buildFallbackResult(rawOcrText);
    }
    throw new ApiError(503, 'AI document analysis failed: ' + error.message);
  }
};

const buildFallbackResult = (rawText) => ({
  detectedLanguages: ['english'],
  primaryLanguage:   'english',
  correctedText: rawText
    ? 'Extracted Text:\n\n' + rawText.replace(/\n{3,}/g, '\n\n').trim()
    : 'Could not extract text from this document.',
  documentType:      'other',
  extractedFields:   [],
  piiFields:         [],
  hasPII:            false,
  structuredContent: { sections: [] },
  confidenceScore:   55,
  healthScore:       50,
  healthDetails: {
    clarity:      50,
    completeness: 50,
    readability:  50,
    suggestions:  ['AI analysis was incomplete — please try again or upload a clearer image'],
  },
});

const processDocument = async (imageBuffer, mimeType) => {
  const startTime = Date.now();
  let rawOcrText = '';
  let ocrEngine  = 'tesseract+gemini';

  if (mimeType === 'application/pdf') {
    rawOcrText = '[PDF document — direct AI analysis]';
    ocrEngine  = 'gemini-only';
  } else {
    const ocrResult = await runTesseract(imageBuffer);
    rawOcrText = ocrResult.text;
  }

  const aiResult = await processWithGemini(rawOcrText);

  return {
    rawOcrText,
    ocrEngine,
    processingTimeMs: Date.now() - startTime,
    ...aiResult,
  };
};

module.exports = { processDocument, runTesseract, processWithGemini };
