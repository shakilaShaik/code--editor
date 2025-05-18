import React, { useState, useEffect } from "react";

export default function CodeRunner() {
  const [code, setCode] = useState('print("Hello, World!")');
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState(null);
  const [returnCode, setReturnCode] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate a random job id each time you run code
  function generateJobId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async function runCode() {
    setResult(null);
    setErrors(null);
    setReturnCode(null);
    setLoading(true);

    const newJobId = generateJobId();
    setJobId(newJobId);

    try {
      const res = await fetch("https://code-ediitor.onrender.com/run-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: newJobId, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.output);
        setErrors(data.errors);
        setReturnCode(data.returncode);
      } else {
        setErrors(data.error || "Error running code");
      }
    } catch (err) {
      setErrors("Network error");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Code Runner</h1>

      <div>
        <label className="block font-semibold mb-1">Code</label>
        <textarea
          rows={8}
          className="w-full p-3 border rounded-md font-mono bg-gray-900 text-green-400"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <button
        onClick={runCode}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Running..." : "Run Code"}
      </button>

      {jobId && <p className="mt-4 text-sm text-gray-600">Job ID: {jobId}</p>}

      {(result !== null || errors !== null) && (
        <div className="mt-4 p-4 border rounded bg-gray-50 font-mono whitespace-pre-wrap">
          <strong>Output:</strong>
          <pre>{result || "(No output)"}</pre>
          <strong>Errors:</strong>
          <pre>{errors || "(No errors)"}</pre>
          <strong>Return Code:</strong> {returnCode}
        </div>
      )}
    </div>
  );
}
