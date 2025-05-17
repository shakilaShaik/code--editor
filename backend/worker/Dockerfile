FROM python:3.11-slim

# Install docker CLI
RUN apt-get update && apt-get install -y docker.io && apt-get clean

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "worker.py"]
