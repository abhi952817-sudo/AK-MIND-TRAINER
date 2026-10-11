// Multilingual profanity and toxic spam filter (Hindi + English)
const BANNED_PATTERNS = [
  /\b(fuck|shit|asshole|bitch|bastard|dick|pussy|cunt)\b/gi,
  /\b(chutiya|bhosdike|madarchod|behenchod|gandu|harami|saale)\b/gi,
  /\b(mc|bc|bsdk)\b/gi,
];

export function sanitizeChatMessage(input: string): { cleanText: string; isBlocked: boolean } {
  let cleanText = input.trim();

  // Limit maximum reasonable length
  if (cleanText.length > 120) {
    cleanText = cleanText.substring(0, 120);
  }

  // Check and mask toxic words
  let hasVulgarity = false;
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(cleanText)) {
      hasVulgarity = true;
      cleanText = cleanText.replace(pattern, '***');
    }
  }

  // Prevent repeated character flooding spam e.g. "aaaaaaa", "!!!!!!!!!!"
  cleanText = cleanText.replace(/(.)\1{5,}/g, '$1$1$1');

  return {
    cleanText,
    isBlocked: cleanText.length === 0,
  };
}

export const QUICK_HINDI_ENGLISH_PRESETS = [
  'चलो देखते हैं! 😄',
  'बच के रहना! 💥',
  'वाह भाई क्या रोल था! 🎲',
  'Good luck everyone! 🍀',
  'अब मेरी बारी है! 👑',
  'अरे यार! मिस हो गया 😅',
  'Please hurry up! ⏳',
  'Well played dost! 👏',
];
