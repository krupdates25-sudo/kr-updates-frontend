// Professional AI Service using Google Gemini AI
const GEMINI_API_KEY = 'AIzaSyChb1v-Hs_3fqjdMSNKMsNM_9Ew--3ozGo'; // Replace with your actual API key
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const aiService = {
  // Generate email notification content
  generateEmailContent: async (postData) => {
    try {
      const prompt = `Generate an engaging email notification for a news article with the following details:
      Title: "${postData.title}"
      Content: "${postData.content || postData.excerpt}"
      Category: "${postData.category || 'News'}"
      Tags: ${postData.tags ? postData.tags.join(', ') : 'General'}
      
      Create:
      1. A compelling subject line (max 60 characters) that creates urgency and interest
      2. A brief, engaging email content (2-3 sentences) that summarizes the key points and encourages clicking
      
      Format the response as JSON:
      {
        "subject": "Your subject line here",
        "content": "Your email content here"
      }
      
      Make it sound professional, urgent for breaking news, and engaging for readers.`;

      const response = await callGeminiAPI(prompt);

      try {
        const parsedResponse = JSON.parse(response);
        return {
          success: true,
          data: parsedResponse,
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          success: true,
          data: {
            subject: `Breaking: ${postData.title}`,
            content:
              postData.excerpt || postData.content?.substring(0, 150) + '...',
          },
        };
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      return {
        success: false,
        error: error.message,
        data: {
          subject: `Breaking: ${postData.title}`,
          content:
            postData.excerpt || postData.content?.substring(0, 150) + '...',
        },
      };
    }
  },

  // Generate blog post content based on title and category
  generateContent: async (title, category) => {
    try {
      const prompt = `Generate a comprehensive, professional blog post about "${title}" in the ${category} category. 
      Include:
      - An engaging introduction
      - 3-4 main sections with headings
      - Bullet points or numbered lists where appropriate
      - A conclusion
      - Use HTML tags for formatting (h2, h3, p, ul, li, ol, strong, em)
      - Make it informative, well-structured, and engaging
      - Length: 500-800 words`;

      const response = await callGeminiAPI(prompt);

      return {
        success: true,
        content: response,
      };
    } catch (error) {
      console.error('Error generating content:', error);
      return {
        success: false,
        error:
          'Failed to generate content. Please check your API key and try again.',
      };
    }
  },

  // Improve existing content
  improveContent: async (content) => {
    try {
      const prompt = `Improve the following content to make it more professional, engaging, and well-structured. 
      Maintain the original meaning but enhance:
      - Clarity and readability
      - Professional tone
      - Better structure and flow
      - More engaging language
      - Keep all HTML formatting
      
      Content to improve:
      ${content}`;

      const response = await callGeminiAPI(prompt);

      return {
        success: true,
        content: response,
      };
    } catch (error) {
      console.error('Error improving content:', error);
      return {
        success: false,
        error: 'Failed to improve content. Please try again.',
      };
    }
  },

  // Generate excerpt from content
  generateExcerpt: async (content, maxLength = 150) => {
    try {
      const cleanContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags

      const prompt = `Create a compelling excerpt (${maxLength} characters or less) from this content that will engage readers and encourage them to read the full article:
      
      ${cleanContent}
      
      Make it engaging, informative, and professional.`;

      const response = await callGeminiAPI(prompt);

      return {
        success: true,
        excerpt: response.substring(0, maxLength),
      };
    } catch (error) {
      console.error('Error generating excerpt:', error);
      return {
        success: false,
        error: 'Failed to generate excerpt. Please try again.',
      };
    }
  },

  // Suggest tags based on content
  suggestTags: async (title, content, category) => {
    try {
      const cleanContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags

      const prompt = `Based on this title "${title}" and content, suggest 6 relevant tags for SEO and categorization. 
      Category: ${category}
      Content: ${cleanContent.substring(0, 500)}...
      
      Return only the tags as a comma-separated list, no other text.`;

      const response = await callGeminiAPI(prompt);
      const tags = response
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      return {
        success: true,
        tags: tags.slice(0, 6),
      };
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return {
        success: false,
        error: 'Failed to suggest tags. Please try again.',
      };
    }
  },

  // Professional method for processing text with custom prompts using Gemini AI
  processTextWithPrompt: async (text, prompt) => {
    try {
      let aiPrompt = '';

      // Create specific prompts based on user input
      if (
        prompt.toLowerCase().includes('hindi') ||
        prompt.toLowerCase().includes('हिंदी')
      ) {
        aiPrompt = `Translate the following text to Hindi. Provide only the Hindi translation, no additional text:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('english') ||
        prompt.toLowerCase().includes('अंग्रेजी')
      ) {
        aiPrompt = `Translate the following text to English. Provide only the English translation, no additional text:
        
        ${text}`;
      } else if (prompt.toLowerCase().includes('spanish')) {
        aiPrompt = `Translate the following text to Spanish. Provide only the Spanish translation, no additional text:
        
        ${text}`;
      } else if (prompt.toLowerCase().includes('french')) {
        aiPrompt = `Translate the following text to French. Provide only the French translation, no additional text:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('grammar') ||
        prompt.toLowerCase().includes('correct')
      ) {
        aiPrompt = `Correct the grammar and spelling in the following text. Maintain the original meaning and tone:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('formal') ||
        prompt.toLowerCase().includes('professional')
      ) {
        aiPrompt = `Rewrite the following text in a more formal and professional tone:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('casual') ||
        prompt.toLowerCase().includes('informal')
      ) {
        aiPrompt = `Rewrite the following text in a more casual and friendly tone:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('shorter') ||
        prompt.toLowerCase().includes('brief')
      ) {
        aiPrompt = `Make the following text shorter and more concise while keeping the main message:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('detailed') ||
        prompt.toLowerCase().includes('expand')
      ) {
        aiPrompt = `Expand the following text with more details and explanations:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('simple') ||
        prompt.toLowerCase().includes('simplify')
      ) {
        aiPrompt = `Simplify the following text to make it easier to understand:
        
        ${text}`;
      } else if (
        prompt.toLowerCase().includes('improve') ||
        prompt.toLowerCase().includes('better')
      ) {
        aiPrompt = `Improve the following text to make it more engaging, clear, and professional:
        
        ${text}`;
      } else {
        // Custom prompt - use user's exact instruction
        aiPrompt = `${prompt}
        
        Text to process:
        ${text}`;
      }

      const response = await callGeminiAPI(aiPrompt);

      return {
        success: true,
        content: response,
      };
    } catch (error) {
      console.error('Error processing text with prompt:', error);
      return {
        success: false,
        error:
          'Failed to process text. Please check your API key and try again.',
      };
    }
  },
};

// Function to call Google Gemini API
async function callGeminiAPI(prompt) {
  // Check if API key is set
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    throw new Error(
      'Gemini API key not configured. Please add your API key to the service.'
    );
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Gemini API error: ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

export default aiService;
