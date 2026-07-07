import React from 'react';
import { ExternalLink, AlertCircle, Briefcase, TrendingUp, ShieldAlert } from 'lucide-react';

// --- Verdict Spectrum Config ---
const verdictConfig = {
  "Strong Invest": { color: '#3DD68C', position: 5 },
  "Lean Invest":   { color: '#7FCE9E', position: 25 },
  "Neutral":       { color: '#C4A94F', position: 50 },
  "Lean Pass":     { color: '#D68B5B', position: 75 },
  "Strong Pass":   { color: '#E5484D', position: 95 },
  "Insufficient Data": { color: '#8B92A5', position: 50 },
};

// --- Sub-Components ---

function VerdictGauge({ verdict, confidence }) {
  const config = verdictConfig[verdict] || verdictConfig["Neutral"];
  const markerPosition = config.position;

  return (
    <div className="w-full">
      {/* Gauge Bar */}
      <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #3DD68C, #7FCE9E, #C4A94F, #D68B5B, #E5484D)' }}>
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all duration-700 ease-out"
          style={{
            left: `${markerPosition}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: config.color,
            borderColor: '#0A0E14',
            boxShadow: `0 0 8px ${config.color}50`,
          }}
        />
      </div>

      {/* Labels below gauge */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#3DD68C', fontFamily: 'var(--font-mono)' }}>Invest</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#E5484D', fontFamily: 'var(--font-mono)' }}>Pass</span>
      </div>

      {/* Verdict + Confidence readout */}
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-lg font-bold" style={{ color: config.color, fontFamily: 'var(--font-headline)' }}>
          {verdict}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Confidence: <span className="font-mono-num font-bold" style={{ color: config.color }}>{confidence}%</span>
        </span>
      </div>
    </div>
  );
}

function ReasoningSection({ icon: Icon, title, items, accentColor }) {
  return (
    <div className="py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-headline)' }}>
          {title}
        </h3>
      </div>
      {items && items.length > 0 ? (
        <ul className="space-y-2 pl-6">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic pl-6" style={{ color: 'var(--color-text-muted)' }}>No data available.</p>
      )}
    </div>
  );
}

function SourceChips({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="pt-5">
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors"
            style={{
              backgroundColor: 'rgba(91, 141, 239, 0.06)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[180px]">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// --- Main ReportCard ---

export default function ReportCard({ data, originalQuery }) {
  // --- Insufficient Data / Invalid Entity ---
  if (data.verdict === "Insufficient Data" || data.insufficient_data_reason) {
    return (
      <div
        className="w-full max-w-2xl mx-auto mt-10 p-6 rounded-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
          <div>
            <h2 className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-headline)', color: 'var(--color-text-primary)' }}>
              Insufficient Data
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {data.insufficient_data_reason || "Not enough information to form a verdict."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Full Report ---
  return (
    <div
      className="w-full max-w-5xl mx-auto mt-10 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row">

        {/* LEFT COLUMN: Gauge + Key Stats (sticky on desktop) */}
        <div
          className="w-full lg:w-[340px] flex-shrink-0 p-6 lg:p-8 lg:sticky lg:top-0 lg:self-start"
          style={{ borderRight: '1px solid var(--color-border)' }}
        >
          <p className="text-[10px] uppercase tracking-widest mb-5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Verdict
          </p>
          <VerdictGauge verdict={data.verdict} confidence={data.confidence} />

          {!data.is_listed && (
            <div className="text-xs font-mono text-amber-400/80 border border-amber-400/20 rounded px-3 py-2 mt-3">
              Unlisted company — analysis based on qualitative signals only, financial ratios unavailable
            </div>
          )}

          {data.resolved_name && originalQuery && data.resolved_name.toLowerCase() !== originalQuery.toLowerCase().trim() && (
            <div className="text-xs font-mono text-blue-400/80 border border-blue-400/20 rounded px-3 py-2 mt-2">
              Interpreting "{originalQuery}" as {data.resolved_name}
            </div>
          )}

          {/* Key Stats (if we had any structured financial numbers, they'd go here) */}
          <div className="mt-8 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Analysis Summary
            </p>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Quality</p>
                <p className="font-mono-num text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {data.business_quality?.length || 0}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>signals</p>
              </div>
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Momentum</p>
                <p className="font-mono-num text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {data.momentum?.length || 0}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>signals</p>
              </div>
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Red Flags</p>
                <p className="font-mono-num text-lg font-bold mt-0.5" style={{ color: data.red_flags?.length > 0 ? 'var(--color-strong-pass)' : 'var(--color-strong-invest)' }}>
                  {data.red_flags?.length || 0}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>flagged</p>
              </div>
              <div>
                <p className="text-[10px] uppercase" style={{ color: 'var(--color-text-muted)' }}>Sources</p>
                <p className="font-mono-num text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {data.sources?.length || 0}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>cited</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Reasoning buckets + Sources */}
        <div className="flex-1 p-6 lg:p-8">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Detailed Analysis
          </p>

          <ReasoningSection
            icon={Briefcase}
            title="Business Quality"
            items={data.business_quality}
            accentColor="var(--color-accent)"
          />
          <ReasoningSection
            icon={TrendingUp}
            title="Momentum & Trajectory"
            items={data.momentum}
            accentColor="var(--color-lean-invest)"
          />
          <ReasoningSection
            icon={ShieldAlert}
            title="Red Flags"
            items={data.red_flags}
            accentColor="var(--color-strong-pass)"
          />

          <SourceChips sources={data.sources} />
        </div>
      </div>
    </div>
  );
}
