import re
import uuid
import base64
import aiohttp
import asyncio
import subprocess

from pathlib import Path


PROMPT = """You are given a prompt describing a video. Your task is to break down the video description into {n_scenes} scene prompts.

Each scene prompt should:
- Represent a natural segment of the overall narrative described in the input prompt
- Contribute to a coherent flow across the entire video, with a logical progression in story, setting, characters, or actions
- Contain enough detail to guide high-quality video generation:
  - Subject: The object, person, animal, or scenery that you want in your video
  - Context: The background or setting in which the subject is placed
  - Action: What the subject is doing (for example, walking, running, or turning their head)
  - Style: This can be general or very specific. Consider using specific film style keywords, such as horror film, film noir, or animated styles like cartoon style render
  - Camera motion (Optional): What the camera is doing, such as an aerial view, eye-level, top-down shot, or low-angle shot
  - Composition (Optional): How the shot is framed, such as a wide shot, close-up, or extreme close-up
  - Ambiance (Optional): How color and light contribute to the scene, such as blue tones, night, or warm tones

The final video will be created by stitching the scenes together in sequence, so the breakdown should feel like a continuous video rather than separate clips

NOTE: Avoid violence, gore or any other inappropriate, unsafe terms.

<input_prompt>
{input_prompt}
</input_prompt>

Output the broken-down scenes in the following format:

<output_scenes>
<scene>
[Detailed description of the first scene]
</scene>
<scene>
[Detailed description of the second scene]
</scene>

[Continue for all remaining scenes until the last one]
</output_scenes>"""


def get_scene_breakdown_prompt(input_prompt: str, n_scenes: int) -> str:
    return PROMPT.format(input_prompt=input_prompt, n_scenes=n_scenes)


def parse_scenes(text: str) -> list[str]:
    """
    Parse <scene>...</scene> blocks from the model's output text.

    Args:
        text (str): The raw text containing <output_scenes> with <scene> blocks.

    Returns:
        list[str]: A list of scene descriptions, each as a string.
    """
    # Regex to capture text between <scene> and </scene>
    scenes = re.findall(r"<scene>\s*(.*?)\s*</scene>", text, re.DOTALL)
    
    # Strip whitespace from each scene
    return [scene.strip() for scene in scenes]


def find_min_sum_solution(N: int):
    """
    You are given an integer N >= 5. Find four non-negative integers x, y, z, t such that:
    5x + 6y + 7z + 8t = N and (x + y + z + t) is minimized

    Special Case:
    If N = 9, the solution is (x, y, z, t) = (0, 0, 0, 1)
    """
    if N < 5:
        raise ValueError("N must be >= 5")
    if N == 9:
        return (0, 0, 0, 1)

    best = None
    min_count = float("inf")

    # Loop for t (using 8s)
    for t in range(N // 8 + 1):
        # Loop for z (using 7s)
        for z in range((N - 8*t) // 7 + 1):
            # Loop for y (using 6s)
            for y in range((N - 8*t - 7*z) // 6 + 1):
                remaining = N - (8*t + 7*z + 6*y)
                if remaining < 0:
                    continue
                if remaining % 5 != 0:
                    continue
                x = remaining // 5
                count = x + y + z + t
                if count < min_count:
                    min_count = count
                    best = (x, y, z, t)

    return best


def split_long_duration(duration_seconds: int) -> list[int]:
    """
    Split a long duration into a list of durations, each of which is in [5, 6, 7, 8] seconds.
    """
    n_d_5, n_d_6, n_d_7, n_d_8 = find_min_sum_solution(duration_seconds)

    # list durations
    durations = []
    # prefer longer first
    durations.extend([8] * n_d_8)
    durations.extend([7] * n_d_7)
    durations.extend([6] * n_d_6)
    durations.extend([5] * n_d_5)

    return durations


async def download_video(url: str, output_path: Path):
    """
    Download video from a public URL and save it as output_path.
    """
    output_path = str(output_path)
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()  # Raise error if the request failed

            with open(output_path, "wb") as file:
                async for chunk in response.content.iter_chunked(8192):
                    file.write(chunk)

async def extract_last_frame(video_path: Path, output_path: Path):
    """
    Extracts the last frame from a video using ffmpeg.

    Args:
        video_path (str): Path to the input video file.
        output_path (str): Path where the last frame image will be saved.
    """
    video_path = str(video_path)
    output_path = str(output_path)

    # ffmpeg command
    cmd = [
        "ffmpeg",
        "-sseof", "-1",         # Seek to 1 second before end (last frame)
        "-i", video_path,  # Input video file
        "-update", "1",         # Overwrite single output file
        "-q:v", "1",            # Best quality image
        output_path,       # Output file path
        "-y"                    # Overwrite without asking
    ]

    # Run command
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await proc.communicate()


def read_image_to_base64(image_path: Path) -> str:
    """
    Read an image file and return its base64-encoded string.
    """
    image_path = str(image_path)
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def merge_videos(video_paths: list[Path], output_path: Path, temp_dir: Path | None = None):
    """
    Merge videos into a single video using ffmpeg.
    """
    # Create file list for ffmpeg concat
    if not temp_dir:
        temp_dir = Path(f"./tmp/video_generation_{uuid.uuid4().hex}")
    temp_dir.mkdir(parents=True, exist_ok=True)

    concat_file = temp_dir / "concat_list.txt"
    with open(concat_file, "w") as f:
        for video_path in video_paths:
            f.write(f"file '{video_path.absolute()}'\n")

    # Merge videos
    concat_cmd = [
            "ffmpeg",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c",
            "copy",
            str(output_path),
            "-y",
        ]

    # Run command
    proc = await asyncio.create_subprocess_exec(
        *concat_cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await proc.communicate()


def generate_unique_video_name(length=12):
    """
    Generates a short, unique hexadecimal name suitable for a filename.

    Args:
        length (int): The desired length of the unique name. Defaults to 12.

    Returns:
        str: A unique hexadecimal string of the specified length.
    """
    # Generate a random UUID and take the first `length` characters of its hex representation
    return uuid.uuid4().hex[:length]


def construct_blob_path(file_name: str):
    return f"video_generation/{file_name}"