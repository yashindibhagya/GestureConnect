/**
 * translationApi.js
 * 
 * This file provides translation services for the application,
 * now with support for English, Sinhala, and Tamil using Gemini API
 */

// Import Gemini translation service
import GeminiTranslationService from './GeminiTranslationService';

// Export the language constants
export const LANGUAGES = {
    ENGLISH: 'en',
    SINHALA: 'si',
    TAMIL: 'ta'
};

/**
 * Translates Sinhala text to English
 * @param {string} text - The Sinhala text to translate
 * @returns {Promise<string>} - The translated English text
 */
export const translateSinhalaToEnglish = async (text) => {
    return GeminiTranslationService.translateSinhalaToEnglish(text);
};

/**
 * Translates English text to Sinhala
 * @param {string} text - The English text to translate
 * @returns {Promise<string>} - The translated Sinhala text
 */
export const translateEnglishToSinhala = async (text) => {
    return GeminiTranslationService.translateEnglishToSinhala(text);
};

/**
 * Translates Tamil text to English
 * @param {string} text - The Tamil text to translate
 * @returns {Promise<string>} - The translated English text
 */
export const translateTamilToEnglish = async (text) => {
    return GeminiTranslationService.translateTamilToEnglish(text);
};

/**
 * Translates English text to Tamil
 * @param {string} text - The English text to translate
 * @returns {Promise<string>} - The translated Tamil text
 */
export const translateEnglishToTamil = async (text) => {
    return GeminiTranslationService.translateEnglishToTamil(text);
};

/**
 * General translation function that handles multiple language pairs
 * @param {string} text - The text to translate
 * @param {string} sourceLanguage - Source language code ('en', 'si', 'ta')
 * @param {string} targetLanguage - Target language code ('en', 'si', 'ta')
 * @returns {Promise<string>} - The translated text
 */
export const translateText = async (text, sourceLanguage, targetLanguage) => {
    return GeminiTranslationService.translateText(text, sourceLanguage, targetLanguage);
};

export default {
    translateSinhalaToEnglish,
    translateEnglishToSinhala,
    translateTamilToEnglish,
    translateEnglishToTamil,
    translateText,
    LANGUAGES
};