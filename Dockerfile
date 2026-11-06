# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend source and build static bundle
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Python Backend & Native CAD Stack
# ==========================================
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8080

WORKDIR /app

# Install system dependencies required by Gmsh, OpenCASCADE, Trimesh, and OpenGL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglx-mesa0 \
    libglu1-mesa \
    libxcursor1 \
    libxinerama1 \
    libxrandr2 \
    libxft2 \
    libx11-6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend application code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose default Cloud Run / standard HTTP port
EXPOSE 8080

WORKDIR /app/backend

# Launch Uvicorn listening on $PORT (defaults to 8080)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1

