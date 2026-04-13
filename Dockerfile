# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY huggingface-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code from the subfolder
COPY huggingface-backend/ .

# Hugging Face Spaces defaults to port 7860
EXPOSE 7860

# Command to run the application (main.py is now at the root of /app)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
