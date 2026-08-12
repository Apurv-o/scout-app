"use client";

import { useState } from "react";

interface KeyPanelProps {
  connected: boolean;
  onChange: (connected: boolean) => void;
}

export default function KeyPanel({ connected, onChange }: KeyPanelProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    const apiKey = value.trim();
    if (!apiKey) {
      setMessage("Enter a key before saving.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        onChange(true);
        setMessage("Key saved. You can search now.");
      } else {
        setMessage(data.error || "Could not save the key.");
      }
    } catch {
      setMessage("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel" id="keyPanel">
      <div className="panel-label">
        <span className={`status-dot ${connected ? "on" : ""}`} />
        <span>{connected ? "Signal source — key connected" : "Signal source — no key connected"}</span>
      </div>

      <details className="howto">
        <summary>How to get a free YouTube API key (2 minutes)</summary>
        <ol>
          <li>
            Go to{" "}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              console.cloud.google.com
            </a>{" "}
            and create (or pick) a project.
          </li>
          <li>
            Open <em>APIs &amp; Services → Library</em>, search for <strong>YouTube Data API v3</strong>, and enable it.
          </li>
          <li>
            Open <em>APIs &amp; Services → Credentials → Create Credentials → API key</em>.
          </li>
          <li>Paste it below — it&apos;s encrypted before it&apos;s stored in Postgres.</li>
        </ol>
      </details>

      <div className="key-row">
        <input
          className="field"
          type={visible ? "text" : "password"}
          placeholder="Paste your YouTube Data API v3 key"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
        <button className="btn btn-ghost" type="button" onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide" : "Show"}
        </button>
        <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save key"}
        </button>
      </div>

      {message && <p className="key-note">{message}</p>}
      <p className="key-note">
        Encrypted at rest in Postgres. Requests to YouTube run server-side — your key never touches the browser again after this form.
      </p>
    </section>
  );
}
