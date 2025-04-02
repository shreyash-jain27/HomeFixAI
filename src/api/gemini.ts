
/**
 * This file contains utilities for interacting with the Google Gemini API
 */

// The API endpoint for Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

// Default models
export const DEFAULT_TEXT_MODEL = "gemini-1.5-pro";
export const DEFAULT_VISION_MODEL = "gemini-1.5-pro-vision";

/**
 * Sends a text-only prompt to the Gemini model
 */
export const generateTextResponse = async (
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_TEXT_MODEL
): Promise<string> => {
  try {
    const response = await fetch(
      `${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    
    if (
      result.candidates &&
      result.candidates[0]?.content?.parts &&
      result.candidates[0].content.parts[0]?.text
    ) {
      return result.candidates[0].content.parts[0].text;
    }
    
    console.log("Raw API response:", result);
    return "I couldn't generate a proper response. Please try again.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

/**
 * Sends a prompt with images to the Gemini model for analysis
 */
export const generateImageResponse = async (
  prompt: string,
  imageUrls: string[],
  apiKey: string,
  model: string = DEFAULT_VISION_MODEL
): Promise<string> => {
  try {
    // Format message with text and images
    const parts: Array<{text?: string, inlineData?: {data: string, mimeType: string}}> = [{ text: prompt }];
    
    // Add images to parts
    for (const imageUrl of imageUrls) {
      try {
        // Remove the data:image/jpeg;base64, prefix
        const mimeType = imageUrl.split(';')[0].replace('data:', '');
        const base64Content = imageUrl.split(',')[1];
        
        if (!base64Content || !mimeType) {
          console.error("Invalid image format:", { mimeType, hasContent: !!base64Content });
          continue;
        }
        
        parts.push({
          inlineData: {
            data: base64Content,
            mimeType: mimeType,
          }
        });
        
        console.log("Successfully processed image with mime type:", mimeType);
      } catch (err) {
        console.error("Error processing image:", err);
      }
    }
    
    console.log(`Sending ${parts.length - 1} images to Gemini API`);
    
    const payload = {
      contents: [
        {
          parts: parts
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    };
    
    console.log("Sending request to Gemini API with payload:", JSON.stringify(payload).substring(0, 200) + "...");
    
    const response = await fetch(
      `${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("API Response received:", result);
    
    if (
      result.candidates &&
      result.candidates[0]?.content?.parts &&
      result.candidates[0].content.parts[0]?.text
    ) {
      return result.candidates[0].content.parts[0].text;
    }
    
    console.log("Raw API response:", result);
    return "I couldn't analyze the image properly. Please try again.";
  } catch (error) {
    console.error("Error calling Gemini API for image:", error);
    throw error;
  }
};
