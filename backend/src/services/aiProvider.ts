import axios from 'axios';

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// Lazy load environment variables (to ensure dotenv is loaded first)
function getConfig() {
  return {
    AI_PROVIDER: process.env.AI_PROVIDER || 'glm',
    GLM_API_KEY: process.env.GLM_API_KEY || ''
  };
}

export interface ValidationResult {
  isValid: boolean;
  similarity: number;
  explanation: string;
  confidence: number;
}

/**
 * Check if AI provider is configured correctly
 */
export async function checkAIProvider(): Promise<{ 
  ok: boolean; 
  provider: string; 
  message: string;
  hasApiKey: boolean;
}> {
  const { AI_PROVIDER, GLM_API_KEY } = getConfig();
  logConfig();
  const hasKey = !!GLM_API_KEY && GLM_API_KEY.length > 10;
  
  if (AI_PROVIDER === 'glm') {
    if (!hasKey) {
      return {
        ok: false,
        provider: 'glm',
        message: '❌ GLM_API_KEY not configured - using fallback validation',
        hasApiKey: false
      };
    }
    
    // Test API call
    try {
      const response = await axios.post(
        GLM_API_URL,
        {
          model: 'glm-4',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        },
        {
          headers: {
            'Authorization': `Bearer ${getConfig().GLM_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (response.status === 200) {
        return {
          ok: true,
          provider: 'glm',
          message: '✅ GLM-4 API connected and working',
          hasApiKey: true
        };
      }
    } catch (error: any) {
      return {
        ok: false,
        provider: 'glm',
        message: `❌ GLM-4 API Error: ${error.response?.status === 401 ? 'Invalid API Key' : error.message}`,
        hasApiKey: true
      };
    }
  }
  
  const config = getConfig();
  return {
    ok: false,
    provider: config.AI_PROVIDER,
    message: `⚠️ Unknown AI provider: ${config.AI_PROVIDER}`,
    hasApiKey: false
  };
}

/**
 * Validate answer using configured AI provider
 * Uses semantic similarity to compare user answer with correct answer
 */
export async function validateAnswerWithAI(
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<ValidationResult> {
  logConfig();
  
  // Don't waste API calls on empty answers
  if (!userAnswer || userAnswer.trim().length < 1) {
    return {
      isValid: false,
      similarity: 0,
      explanation: 'Empty answer provided',
      confidence: 1
    };
  }

  // Pre-check: Very short answers that don't match are likely wrong
  const userTrimmed = userAnswer.trim();
  const correctTrimmed = correctAnswer.trim();
  
  // If answer is too short (less than 2 chars), reject immediately
  if (userTrimmed.length < 2) {
    return {
      isValid: false,
      similarity: 0.1,
      explanation: 'Answer too short',
      confidence: 0.9
    };
  }

  const { GLM_API_KEY } = getConfig();
  
  // If no API key configured, use fallback
  if (!GLM_API_KEY || GLM_API_KEY.length < 20) {
    console.log('[AI] No valid API key configured, using fallback validation');
    return fallbackValidation(correctAnswer, userAnswer);
  }

  try {
    console.log(`[AI] Validating answer for question: "${question.substring(0, 50)}..."`);
    console.log(`[AI] Correct: "${correctTrimmed.substring(0, 50)}..." | User: "${userTrimmed.substring(0, 50)}..."`);
    
    const response = await axios.post(
      GLM_API_URL,
      {
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: `You are a precise trivia answer validator. Your task is to compare the user's answer with the correct answer.

VALIDATION RULES:
1. Semantic equivalence matters more than exact wording
2. Accept answers with minor spelling errors if meaning is clear
3. Accept partial answers if they contain the KEY information
4. Reject answers that are factually wrong or irrelevant
5. Consider the question context when evaluating

THRESHOLD: isValid = true only if similarity >= 0.7

RESPONSE FORMAT (JSON only):
{
  "isValid": boolean,
  "similarity": number (0.0 to 1.0),
  "explanation": "brief reason",
  "confidence": number (0.0 to 1.0)
}

Examples:
- Q: "Capital of France?" Correct: "Paris" User: "paris" → {"isValid": true, "similarity": 1.0, "explanation": "Exact match", "confidence": 1.0}
- Q: "2+2?" Correct: "4" User: "four" → {"isValid": true, "similarity": 1.0, "explanation": "Same meaning", "confidence": 0.95}
- Q: "Largest planet?" Correct: "Jupiter" User: "Saturn" → {"isValid": false, "similarity": 0.2, "explanation": "Wrong planet", "confidence": 0.9}`
          },
          {
            role: 'user',
            content: `Question: "${question}"
Correct Answer: "${correctTrimmed}"
User Answer: "${userTrimmed}"

Evaluate if the user's answer is correct. Return JSON only.`
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${GLM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const aiContent = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiContent.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn('[AI] No JSON found in response:', aiContent);
      throw new Error('No JSON found in AI response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    const validationResult: ValidationResult = {
      isValid: result.isValid === true && (result.similarity || 0) >= 0.7,
      similarity: Math.min(1, Math.max(0, result.similarity || 0)),
      explanation: result.explanation || 'No explanation provided',
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5))
    };
    
    console.log(`[AI] Validation result:`, validationResult);
    return validationResult;
    
  } catch (error: any) {
    console.error('[AI] Validation error:', error.message);
    
    // Fallback to simple matching
    return fallbackValidation(correctAnswer, userAnswer);
  }
}

/**
 * Fallback validation using simple string matching
 * Used when AI provider is unavailable
 */
function fallbackValidation(correctAnswer: string, userAnswer: string): ValidationResult {
  const correct = correctAnswer.toLowerCase().trim();
  const user = userAnswer.toLowerCase().trim();
  
  // Remove common punctuation and extra spaces
  const normalize = (s: string) => s.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const normCorrect = normalize(correct);
  const normUser = normalize(user);
  
  // Exact match (normalized)
  if (normCorrect === normUser) {
    return { isValid: true, similarity: 1, explanation: 'Exact match (fallback)', confidence: 1 };
  }
  
  // Contains match (one contains the other)
  if (normCorrect.includes(normUser) || normUser.includes(normCorrect)) {
    // If user answer is very short compared to correct, might be incomplete
    const lengthRatio = normUser.length / normCorrect.length;
    if (lengthRatio >= 0.5) {
      return { isValid: true, similarity: 0.85, explanation: 'Partial match (fallback)', confidence: 0.7 };
    }
  }
  
  // Word overlap analysis
  const correctWords = normCorrect.split(/\s+/).filter(w => w.length > 2);
  const userWords = normUser.split(/\s+/).filter(w => w.length > 2);
  
  if (correctWords.length === 0 || userWords.length === 0) {
    return { isValid: false, similarity: 0, explanation: 'No meaningful words found (fallback)', confidence: 0.8 };
  }
  
  const overlap = correctWords.filter(w => userWords.includes(w));
  const similarity = overlap.length / Math.max(correctWords.length, userWords.length);
  
  // Threshold for fallback is higher (0.6) to be more conservative
  const isValid = similarity >= 0.6;
  
  return {
    isValid,
    similarity,
    explanation: isValid 
      ? `Word overlap: ${overlap.length}/${correctWords.length} (fallback)` 
      : 'Insufficient word match (fallback)',
    confidence: 0.5
  };
}

// Log configuration on first use (not on import)
let hasLogged = false;
function logConfig() {
  if (!hasLogged) {
    const { AI_PROVIDER, GLM_API_KEY } = getConfig();
    console.log(`[AI] Provider: ${AI_PROVIDER}`);
    console.log(`[AI] API Key: ${GLM_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
    hasLogged = true;
  }
}

export default {
  checkAIProvider,
  validateAnswerWithAI
};
