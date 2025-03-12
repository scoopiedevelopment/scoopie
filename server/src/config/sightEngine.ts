import axios from "axios";

const SIGHTENGINE_USER = "81976547";
const SIGHTENGINE_SECRET = "G3ASWTqD74TyU93iu6FMuAHu7XqUT9Ro"; 

export async function checkImageForNSFW(imageUrl: string) {
  try {
    const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
      params: {
        url: imageUrl,
        models: "nudity,offensive,violence",
        api_user: SIGHTENGINE_USER,
        api_secret: SIGHTENGINE_SECRET,
      },
    });

    const data = response.data;
    return {
      nudity: data.nudity?.raw || 0,
      violence: data.violence?.prob || 0,
    };
  } catch (error) {
    console.error("Error in NSFW check:", error);
    return null;
  }
}
