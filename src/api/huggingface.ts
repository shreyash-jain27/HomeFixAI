
/**
 * This file contains utilities for interacting with the Hugging Face API
 */

// The base URL for the Hugging Face inference API
const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models";

// Default model for text generation
export const DEFAULT_TEXT_MODEL = "deepseek-ai/DeepSeek-R1";

// Default model for image analysis
export const DEFAULT_VISION_MODEL = "deepseek-ai/DeepSeek-R1";

/**
 * Sends a text-only prompt to the Hugging Face model
 */
export const generateTextResponse = async (
  prompt: string,
  token: string,
  model: string = DEFAULT_TEXT_MODEL
): Promise<string> => {
  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    // Handle different response formats from Hugging Face
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    } else if (typeof result === "object" && result.generated_text) {
      return result.generated_text;
    }

    console.log("Raw API response:", result);
    return "I couldn't generate a proper response. Please try again.";
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    throw error;
  }
};

/**
 * Sends a prompt with images to the Hugging Face model for analysis
 */
export const generateImageResponse = async (
  prompt: string,
  imageUrls: string[],
  token: string,
  model: string = DEFAULT_VISION_MODEL
): Promise<string> => {
  try {
    // Format the request for a vision model
    const inputs = {
      text: prompt,
      images: imageUrls,
    };

    const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        inputs,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    // Handle different response formats
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    } else if (typeof result === "object" && result.generated_text) {
      return result.generated_text;
    }

    console.log("Raw API response:", result);
    return "I couldn't analyze the image properly. Please try again.";
  } catch (error) {
    console.error("Error calling Hugging Face API for image:", error);
    throw error;
  }
};
