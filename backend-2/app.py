from flask import Flask, request, jsonify
import subprocess
import tempfile
import os
from dotenv import load_dotenv
load_dotenv()
from flask_cors import CORS


app = Flask(__name__)
frontend_origin=os.getenv("FRONTEND_URL", "*")

CORS(app, origins=[frontend_origin])


def run_code(code: str, timeout=5):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmpfile:
        tmpfile.write(code)
        tmpfile_path = tmpfile.name

    try:
        result = subprocess.run(
            ['python3', tmpfile_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False
        )
        return {
            'output': result.stdout,
            'errors': result.stderr,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'output': '',
            'errors': 'Execution timed out',
            'returncode': -1
        }
    finally:
        os.remove(tmpfile_path)

@app.route('/')
def home():
    return 'Hello, World!'

@app.route('/run-job', methods=['POST'])
def run_job():
    data = request.get_json()

    if not data or 'job_id' not in data or 'code' not in data:
        return jsonify({"error": "Missing job_id or code"}), 400

    job_id = data['job_id']
    code = data['code']

    result = run_code(code)

    return jsonify({
        "job_id": job_id,
        "output": result['output'],
        "errors": result['errors'],
        "returncode": result['returncode']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
