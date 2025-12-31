
import { GoogleGenAI } from "@google/genai";
import { Location, SearchResult, Restaurant } from "../types";

export const findNearbyRestaurants = async (location: Location): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find high-quality restaurants within a 2km radius of my current location (Lat: ${location.latitude}, Lng: ${location.longitude}). 
      Please describe their cuisine and what makes them special. 
      IMPORTANT: For each restaurant you mention, please explicitly include its latitude and longitude in this format: [Name: ..., Lat: ..., Lng: ...]. 
      This is required for my mapping software to place markers.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      },
    });

    const text = response.text || "No description provided.";
    const restaurants: Restaurant[] = [];

    // 1. Extract grounding chunks for specific links
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = groundingMetadata?.groundingChunks;
    
    const chunksMap = new Map<string, any>();
    if (chunks && Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          chunksMap.set(chunk.maps.title.toLowerCase(), chunk.maps);
        }
      });
    }

    // 2. Parse coordinates from text response using regex
    // Looking for pattern: [Name: Restaurant Name, Lat: 1.23, Lng: 4.56]
    const coordRegex = /\[Name:\s*(.*?),\s*Lat:\s*([-+]?\d*\.\d+|\d+),\s*Lng:\s*([-+]?\d*\.\d+|\d+)\]/gi;
    let match;
    while ((match = coordRegex.exec(text)) !== null) {
      const name = match[1].trim();
      const lat = parseFloat(match[2]);
      const lng = parseFloat(match[3]);
      
      const chunkData = chunksMap.get(name.toLowerCase());
      
      restaurants.push({
        name,
        lat,
        lng,
        uri: chunkData?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        snippet: chunkData?.placeAnswerSources?.[0]?.reviewSnippets?.[0]
      });
    }

    // 3. Fallback: If regex didn't find anything, use grounding chunks directly (though they might lack lat/lng)
    if (restaurants.length === 0 && chunksMap.size > 0) {
      chunksMap.forEach((data, name) => {
        restaurants.push({
          name: data.title || name,
          uri: data.uri,
          snippet: data.placeAnswerSources?.[0]?.reviewSnippets?.[0]
        });
      });
    }

    return { text, restaurants };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const message = error?.message || "Unknown API error";
    throw new Error(`Gemini API Error: ${message}`);
  }
};
