// import * as vision from "@google-cloud/vision";
// import ffmpeg from "fluent-ffmpeg";
// const client = new vision.ImageAnnotatorClient();

// export async function checkImageForNSFW(imageUrl: string) {
//   const [result] = await client.safeSearchDetection(imageUrl);
//   const detections = result.safeSearchAnnotation;

//   return {
//     adult: detections?.adult || "UNKNOWN",
//     violence: detections?.violence || "UNKNOWN",
//     medical: detections?.medical || "UNKNOWN",
//     racy: detections?.racy || "UNKNOWN",
// };
// };


// export async function extractFrames(videoUrl: string): Promise<boolean> {
//     return new Promise((resolve) => {
//         const frameImages: string[] = [];

//         ffmpeg(videoUrl)
//             .on("filenames", (filenames) => {
//                 frameImages.push(...filenames);
//             })
//             .on("end", async () => {
//                 for (const frame of frameImages) {
//                     const moderationResult = await checkImageForNSFW(frame);
//                     if (moderationResult.adult === "LIKELY" || moderationResult.adult === "VERY_LIKELY") {
//                         resolve(false); 
//                         return;
//                     }
//                 }
//                 resolve(true);
//             })
//             .screenshots({
//                 count: 5,
//                 folder: "/tmp",
//                 size: "320x240",
//             });
//     });
// }


