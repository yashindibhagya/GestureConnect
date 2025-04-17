// app/utils/cloudinaryHelper.js

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dxjb5lepy';
const CLOUDINARY_VERSION = 'v1742644994'; // Default version for most videos
const CLOUDINARY_VERSION_ALT = 'v1742374651'; // Alternative version for older videos

/**
 * Generate a Cloudinary video URL based on the video name and optional ID
 * @param {string} videoName - Base name of the video (e.g., 'hello', 'a', 'thank-you')
 * @param {string} videoId - Unique identifier added by Cloudinary (e.g., 'g34znt')
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {string} - Complete Cloudinary video URL
 */
export const getVideoUrl = (videoName, videoId, folder) => {
    // If videoId is provided, use it with the main version
    if (videoId) {
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${CLOUDINARY_VERSION}/${videoName}_${videoId}.mp4`;
    }

    // Without videoId, use the alternative version with folder structure
    const folderPath = folder ? `${folder}/` : '';
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${CLOUDINARY_VERSION_ALT}/${folderPath}${videoName}.mp4`;
};

/**
 * Generate a Cloudinary thumbnail URL for the video
 * @param {string} thumbnailName - Base name of the thumbnail
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {string} - Complete Cloudinary thumbnail URL
 */
export const getThumbnailUrl = (thumbnailName, folder = 'thumbnails') => {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${CLOUDINARY_VERSION_ALT}/${folder}/${thumbnailName}.jpg`;
};

/**
 * Process sign data to add Cloudinary URLs
 * @param {Array} signData - Array of sign data objects
 * @returns {Array} - Sign data with added Cloudinary URLs
 */
export const processCloudinaryUrls = (signData) => {
    return signData.map(sign => {
        // Determine folder based on category if needed
        const videoFolder = sign.category === 'alphabet' ? 'alphabet' : '';

        // Generate URLs
        const videoUrl = getVideoUrl(sign.videoName, sign.videoId, videoFolder);
        const thumbnailUrl = getThumbnailUrl(sign.thumbnailName);

        // Return the original object with added URLs
        return {
            ...sign,
            videoUrl,
            thumbnailUrl
        };
    });
};