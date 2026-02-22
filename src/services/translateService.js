/**
 * Translation service using Google Translate's unofficial free API.
 * Runs entirely in the browser — no backend call needed.
 */

const translateService = {
    /**
     * Translate text to target language using the free Google Translate endpoint.
     * @param {string} text - The text to translate
     * @param {string} targetLanguage - The target language code (e.g., 'en', 'hi')
     * @param {string} sourceLanguage - The source language code (default: 'auto')
     * @returns {Promise<{ translatedText: string, from: string, to: string }>}
     */
    translateText: async (text, targetLanguage = 'en', sourceLanguage = 'auto') => {
        if (!text || !text.trim()) {
            return { translatedText: text, from: sourceLanguage, to: targetLanguage };
        }

        try {
            // Google Translate free unofficial endpoint
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.status}`);
            }

            const data = await response.json();

            // Google Translate returns nested arrays: [[["translated","original",null,null,10],...],...]
            // Concatenate all translated segments
            let translatedText = '';
            if (data && data[0]) {
                translatedText = data[0]
                    .filter(segment => segment && segment[0])
                    .map(segment => segment[0])
                    .join('');
            }

            return {
                translatedText: translatedText || text,
                from: (data[2] || sourceLanguage),
                to: targetLanguage,
            };
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    },

    /**
     * Translate multiple texts in one batch (sequential to avoid rate limits)
     * @param {string[]} texts - Array of texts to translate
     * @param {string} targetLanguage - Target language code
     * @returns {Promise<string[]>} Array of translated strings
     */
    translateBatch: async (texts, targetLanguage = 'en') => {
        const results = [];
        for (const text of texts) {
            try {
                const res = await translateService.translateText(text, targetLanguage);
                results.push(res.translatedText);
            } catch {
                results.push(text); // Fallback to original on error
            }
        }
        return results;
    },
};

export default translateService;
