import axios from 'axios';

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

function fuzzySimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

// Use GLM 4.7 for semantic similarity
async function semanticSimilarity(correctAnswer: string, userAnswer: string, question: string): Promise<number> {
  try {
    // TODO: Replace with actual GLM API call
    // For now, return a mock value
    // In production, you would call the GLM API like this:
    /*
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: 'Compare these answers and return similarity score 0-1. Output ONLY: 0.XX'
          },
          {
            role: 'user',
            content: `Question: "${question}"\nCorrect Answer: "${correctAnswer}"\nUser Answer: "${userAnswer}"`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const score = parseFloat(response.data.choices[0].message.content.trim());
    return score;
    */

    // Mock implementation for MVP
    // Use fuzzy matching as fallback
    return fuzzySimilarity(correctAnswer, userAnswer);
  } catch (error) {
    console.error('Semantic similarity error:', error);
    // Fallback to fuzzy matching
    return fuzzySimilarity(correctAnswer, userAnswer);
  }
}

export async function validateAnswer(
  correctAnswer: string,
  userAnswer: string,
  question: string
): Promise<{ isValid: boolean; similarity: number; method: string }> {
  // Step 1: Fuzzy string match
  const fuzzyScore = fuzzySimilarity(correctAnswer, userAnswer);

  // Step 2: Semantic similarity (using GLM 4.7)
  const semanticScore = await semanticSimilarity(correctAnswer, userAnswer, question);

  // Combined score: 30% fuzzy + 70% semantic
  const combinedScore = fuzzyScore * 0.3 + semanticScore * 0.7;

  const isValid = combinedScore >= 0.7;

  return {
    isValid,
    similarity: combinedScore,
    method: semanticScore > 0 ? 'combined' : 'fuzzy-only'
  };
}
