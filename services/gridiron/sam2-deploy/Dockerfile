FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

# System dependencies for OpenCV (video processing)
RUN apt-get update && apt-get install -y \
    git \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install SAM 2 from Meta's repo
RUN pip install git+https://github.com/facebookresearch/sam2.git

# Download SAM 2 Checkpoint (Hiera Large — best for high-res sports footage)
RUN mkdir -p checkpoints && \
    wget -P checkpoints/ https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_large.pt

COPY main.py .

# Vertex AI requires port 8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
