import React, { useState, useEffect } from "react";

export default function CodeRunner() {
  const [code, setCode] = useState('print("Hello, World!")');
  const [input, setInput] = useState("");
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  // Poll for result every 2 seconds when polling is enabled
  useEffect(() => {
    if (!polling || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5050/result/${jobId}`);
        const data = await res.json();

        if (data.status === "done" || data.status === "error") {
          setResult(data.output || JSON.stringify(data));
          setStatus(data.status);
          setPolling(false);
        } else {
          setStatus(data.status);
        }
      } catch (err) {
        setResult("Error fetching result");
        setStatus("error");
        setPolling(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling, jobId]);

  // Submit code for execution
  async function runCode() {
    setResult(null);
    setStatus("queued");
    setPolling(true);

    try {
      const res = await fetch("http://localhost:5050/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, input }),
      });
      const data = await res.json();
      setJobId(data.job_id);
    } catch (err) {
      setResult("Failed to submit code");
      setStatus("error");
      setPolling(false);
    }
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

      <div>
        <label className="block font-semibold mb-1">Input (optional)</label>
        <textarea
          rows={3}
          className="w-full p-3 border rounded-md font-mono bg-gray-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <button
        onClick={runCode}
        disabled={polling}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
        {polling ? "Running..." : "Run Code"}
      </button>

      {status && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <p>
            <strong>Status:</strong> {status}
          </p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-900 text-green-300 rounded font-mono whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
