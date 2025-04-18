//This file contains utilities for interacting with the Google Gemini API

// The API endpoint for Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

// Default models
export const DEFAULT_TEXT_MODEL = "gemini-1.5-pro";
export const DEFAULT_VISION_MODEL = "gemini-2.0-flash";


export const generateTextResponse = async (
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_TEXT_MODEL
): Promise<string> => {
  try {
    // Check if this is a direct response
    if (prompt.startsWith('DIRECT_RESPONSE:')) {
      return prompt.replace('DIRECT_RESPONSE:', '');
    }

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
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(
        `API request failed with status ${response.status}: ${JSON.stringify(
          errorData
        )}`
      );
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
 * Type definition for part in the Gemini API request
 */
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

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
    const parts: GeminiPart[] = [
      {
        text: prompt,
      },
    ];

    // Add images to parts array
    for (const imageUrl of imageUrls) {
      try {
        // Extract mime type and base64 content
        const mimeType = imageUrl.split(";")[0].replace("data:", "");
        const base64Content = imageUrl.split(",")[1];

        if (!base64Content || !mimeType) {
          console.error("Invalid image format:", {
            mimeType,
            hasContent: !!base64Content,
          });
          continue;
        }

        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Content,
          },
        });

        console.log("Successfully processed image with mime type:", mimeType);
      } catch (err) {
        console.error("Error processing image:", err);
      }
    }

    console.log(
      `Sending request with ${parts.length - 1} images to Gemini API`
    );

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
              parts: parts,
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
      throw new Error(
        `API request failed with status ${response.status}: ${JSON.stringify(
          errorData
        )}`
      );
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
