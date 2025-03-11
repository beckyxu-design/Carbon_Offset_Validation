'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('query', query);
    if (file) {
      formData.append('file', file);
    }

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    // Redirect to results page with the analysis data in the query string
    router.push(`/results?result=${encodeURIComponent(JSON.stringify(data))}`);

  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">Carbon Project Analysis</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Project ID</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="e.g., Project 5032"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Upload Document (PDD, KML, Shapefile)
          </label>
          <input type="file" onChange={handleFileChange} className="w-full" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Enter your question about the project"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
