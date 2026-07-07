import React, { useState } from 'react';
import ThinkingSteps from './components/ThinkingSteps';
import ReportCard from './components/ReportCard';
import { Search, ArrowRight } from 'lucide-react';

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isColdStart, setIsColdStart] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  let coldStartTimer;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setError('');
    setIsColdStart(false);

    coldStartTimer = setTimeout(() => {
      setIsColdStart(true);
    }, 5000);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: query })
      });

      if (!response.ok) {
        throw new Error('Search service unavailable. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during research.');
    } finally {
      clearTimeout(coldStartTimer);
      setLoading(false);
      setIsColdStart(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* Header */}
      <header className="max-w-3xl mx-auto text-center mb-14 animate-fade-in-up">
        <p className="text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
          Investment Research Terminal
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-text-primary)' }}>
          AI Research Agent
        </h1>
        <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
          Enter a company name. The agent researches, reasons, and delivers a verdict.
        </p>
      </header>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 transition-colors" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-28 py-3.5 text-sm rounded-lg leading-5 outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
            }}
            placeholder="e.g. Infosys, Zepto, Paytm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute inset-y-1.5 right-1.5 flex items-center gap-1.5 px-4 text-xs font-semibold rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#0A0E14',
              fontFamily: 'var(--font-headline)',
            }}
          >
            Research
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          className="max-w-md mx-auto mt-8 px-4 py-3 rounded-lg text-sm text-center animate-fade-in-up"
          style={{
            backgroundColor: 'rgba(229, 72, 77, 0.1)',
            border: '1px solid rgba(229, 72, 77, 0.3)',
            color: 'var(--color-strong-pass)',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-fade-in-up">
          <ThinkingSteps isColdStart={isColdStart} />
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="animate-fade-in-up">
          <ReportCard data={result} originalQuery={query} />
        </div>
      )}
    </div>
  );
}

export default App;
