import uuid
import shutil

from typing import Literal
from pathlib import Path
from . import utils
from .base import BaseVideoGenerationClient, VideoGenerationResult
from ii_tool.integrations.llm.client import LLMClient
from ii_tool.integrations.storage.base import BaseStorage


class VideoGenerationService:
    def __init__(self, video_generation_client: BaseVideoGenerationClient, llm_client: LLMClient | None, storage: BaseStorage):
        self.video_generation_client = video_generation_client
        self.llm_client = llm_client
        self.storage = storage
        self.base_temp_dir = Path("./tmp/video_generation")
        self.base_temp_dir.mkdir(parents=True, exist_ok=True)
        print("The temporary directory for video generation is: ", self.base_temp_dir.absolute())

    async def generate_video(self, prompt: str, aspect_ratio: Literal["16:9", "9:16"] = "16:9", duration_seconds: int = 5, image_base64: str | None = None, image_mime_type: str | None = None) -> VideoGenerationResult:
        supports_long_generation = getattr(self.video_generation_client, "supports_long_generation", True)
        if duration_seconds <= 8 or not supports_long_generation or not self.llm_client:
            return await self.video_generation_client.generate_video(prompt, aspect_ratio, duration_seconds, image_base64, image_mime_type)

        # break down the prompt into scenes for long video
        durations = utils.split_long_duration(duration_seconds)
        n_scenes = len(durations)

        scene_breakdown_prompt = utils.get_scene_breakdown_prompt(prompt, n_scenes)
        scene_breakdown_response = await self.llm_client.generate(scene_breakdown_prompt)
        scene_breakdown_content = scene_breakdown_response.content
        scene_breakdown_cost = scene_breakdown_response.cost
        scenes = utils.parse_scenes(scene_breakdown_content)

        # print the scenes
        # ------------------------------------------------------------
        print("-"*100)
        print("Scenes and durations:")
        for i, scene in enumerate(scenes):
            print(f"- Scene {i} duration {durations[i]}(s): {scene}")
        print("-"*100)
        # ------------------------------------------------------------

        # temp video directory
        temp_video_dir = self.base_temp_dir / uuid.uuid4().hex
        temp_video_dir.mkdir(parents=True, exist_ok=True)

        scene_video_paths = []

        # generate first scene
        scene_0_result = await self.video_generation_client.generate_video(scenes[0], aspect_ratio, durations[0], image_base64, image_mime_type)
        # download the video to temp video directory
        scene_0_path = temp_video_dir / "scene_0.mp4"
        await utils.download_video(scene_0_result.url, scene_0_path)
        scene_video_paths.append(scene_0_path)

        cost = scene_0_result.cost + scene_breakdown_cost
        # generate subsequent scenes
        for i, scene in enumerate(scenes[1:], 1):
            print(f"Generating scene {i+1} of {n_scenes}")
            # extract the last frame from the previous video
            prev_video_path = scene_video_paths[-1]
            last_frame_path = temp_video_dir / f"last_frame_{i-1}.png"
            await utils.extract_last_frame(prev_video_path, last_frame_path)

            # generate the next scene starting from the last frame of the previous video
            last_frame_base64 = utils.read_image_to_base64(last_frame_path)
            scene_video_result = await self.video_generation_client.generate_video(scene, aspect_ratio, durations[i], last_frame_base64, "image/png")

            # download the video to temp video directory
            scene_video_path = temp_video_dir / f"scene_{i}.mp4"
            await utils.download_video(scene_video_result.url, scene_video_path)

            # add the video path to the list
            scene_video_paths.append(scene_video_path)
            
            cost += scene_video_result.cost

        # merge the scenes into a single video
        merged_video_path = temp_video_dir / "merged_video.mp4"
        await utils.merge_videos(scene_video_paths, merged_video_path, temp_video_dir)

        # upload the merged video to the storage
        name = utils.generate_unique_video_name()
        blob_path = utils.construct_blob_path(f"{name}.mp4")
        await self.storage.write_from_local_path(
            str(merged_video_path),
            blob_path,
            "video/mp4",
        )

        public_url = self.storage.get_public_url(blob_path)

        return VideoGenerationResult(
            url=public_url,
            mime_type="video/mp4",
            size=merged_video_path.stat().st_size,
            cost=cost,
        )
