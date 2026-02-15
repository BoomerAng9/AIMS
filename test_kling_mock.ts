import { klingVideo } from './frontend/lib/kling-video';

async function test() {
  console.log("Testing Kling Mock...");
  try {
    const result = await klingVideo.generateVideo({
      prompt: "A test video",
      model: "kling-2.5-turbo"
    } as any);
    console.log("Generate Result:", result);

    const status = await klingVideo.checkStatus(result.jobId);
    console.log("Status Result:", status);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
