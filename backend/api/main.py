from flask import Flask, request, jsonify
import redis, json, uuid, os
from flask_cors import CORS

r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
app = Flask(__name__)
CORS(app)
@app.route('/')
def home():
    return 'Hello, World!'

@app.route("/run", methods=["POST"])
def run_code():
    payload = request.get_json()
    job_id = str(uuid.uuid4())
    r.hset(job_id, mapping={"status": "queued"})
    r.lpush("code_queue", json.dumps({"id": job_id,
                                      "code": payload.get("code", ""),
                                      "input": payload.get("input", "")}))
    return jsonify({"job_id": job_id})

@app.route("/result/<job_id>")
def get_result(job_id):
    data = r.hgetall(job_id)
    if not data:
        return jsonify({"error": "unknown job"}), 404
    return jsonify({k.decode(): v.decode() for k, v in data.items()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
