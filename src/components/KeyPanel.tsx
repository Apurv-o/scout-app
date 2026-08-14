"use client";

import { useEffect, useState } from "react";

type KeySource = "env" | "database" | "none";

interface KeyPanelProps {
  /** Bump to re-check connection state after searches (key may have been added elsewhere). */
  refreshKey?: number;
}

export default function KeyPanel({ refreshKey = 0 }: KeyPanelProps) {
  const [keySource, setKeySource] = useState<KeySource | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setKeySource(d.keySource ?? "none"))
      .catch(() => setKeySource("none"));
  }, [refreshKey]);

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Paste a key first.");
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the key.");
        return;
      }
      setApiKey("");
      setSaved(true);
      setKeySource("database");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function removeKey() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await fetch("/api/settings", { method: "DELETE" });
      setKeySource("none");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const connected = keySource === "env" || keySource === "database";

  return (
    <section className="panel key-panel">
      <div className="panel-label">
        <span className={`status-dot ${connected ? "on" : ""}`} aria-hidden="true" />
        Signal source
      </div>

      {keySource === "env" && (
        <p className="key-note">
          YouTube key is configured on the server (environment variable) - nothing to do here. Other
          sources (Dailymotion, PeerTube, Archive, Reddit) need no key.
        </p>
      )}

      {keySource === "database" && (
        <>
          <p className="key-note">
            YouTube key saved and encrypted. Sources that need no key are always available.
          </p>
          <div className="key-row">
            <button className="btn btn-ghost" type="button" onClick={removeKey} disabled={busy}>
              Remove stored key
            </button>
          </div>
        </>
      )}

      {keySource === "none" && (
        <>
          <p className="howto-lead">
            Only YouTube needs a key. Get a free one from Google (Console -&gt; APIs &amp; Services
            -&gt; YouTube Data API v3), then paste it below - it is encrypted before storage and the
            browser never holds it again.
          </p>
          <form className="key-row" onSubmit={saveKey}>
            <input
              className="field"
              type="password"
              placeholder="YouTube Data API v3 key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save key"}
            </button>
          </form>
          <details className="howto">
            <summary>How to get a key (2 minutes)</summary>
            <ol>
              <li>Open console.cloud.google.com and create a (free) project.</li>
              <li>APIs &amp; Services -&gt; Library -&gt; search &quot;YouTube Data API v3&quot; -&gt; Enable.</li>
              <li>APIs &amp; Services -&gt; Credentials -&gt; Create credentials -&gt; API key.</li>
              <li>Copy the key and paste it here.</li>
            </ol>
          </details>
        </>
      )}

      {error && <p className="key-note key-error">{error}</p>}
      {saved && <p className="key-note key-ok">Key saved. YouTube searches are live.</p>}
    </section>
  );
}
