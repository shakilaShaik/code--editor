import docker, redis, json, os, uuid, io, tarfile

# Connect to Redis
r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))

# Connect to Docker daemon
client = docker.from_env()

# Function to create a tarball of the file to send into Docker container
def to_tar(buf, name):
    bio = io.BytesIO()
    with tarfile.open(fileobj=bio, mode="w") as tar:
        info = tarfile.TarInfo(name)
        info.size = len(buf)
        tar.addfile(info, io.BytesIO(buf))
    bio.seek(0)
    return bio

# Event loop to process jobs from Redis queue
while True:
    _, raw = r.brpop("code_queue")  # blocking pop from Redis
    job = json.loads(raw)
    job_id, code, user_input = job["id"], job["code"], job["input"]

    r.hset(job_id, mapping={"status": "running"})
    try:
        # Sanitize user input for bash-safe echo
        safe_input = user_input.replace("'", "'\"'\"'")

        # Create isolated container with resource limits
        container = client.containers.create(
            image="python:3.11-slim",
            command=f"bash -c \"echo '{safe_input}' | python main.py\"",
            working_dir="/code",
            network_disabled=True,
            mem_limit="128m",
            cpu_period=100000, cpu_quota=50000  # 0.5 CPU
        )

        # Put the code inside container's /code directory
        container.put_archive("/code", to_tar(code.encode(), "main.py"))

        # Start and wait for execution
        container.start()
        exit_status = container.wait(timeout=10)
        logs = container.logs(stdout=True, stderr=True).decode()

        # Clean up
        container.remove(force=True)

        # Save result to Redis
        r.hset(job_id, mapping={"status": "done", "output": logs})

    except Exception as e:
        r.hset(job_id, mapping={"status": "error", "output": str(e)})
