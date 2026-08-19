/**
 * Catalog — a browsable index of every active nf-core pipeline.
 *
 * This is a reference page, not a control surface: nothing here launches a run.
 * It exists to answer "what else is out there and why does it exist", grouped by
 * the question each pipeline answers rather than by the technique it uses.
 *
 * Data comes from src/pipelineCatalog.js, a static snapshot of nf-co.re/pipelines.json,
 * so the page works with no network and no server. That file is named to avoid
 * colliding with this one — macOS is case-insensitive, so a `catalog.js` next to
 * `Catalog.jsx` makes `import … from "./Catalog"` resolve to the wrong file.
 */

import { useState, useMemo } from "react";
import { CATALOG, PIPELINE_COUNT } from "./pipelineCatalog";

const FOCUS_COUNT = CATALOG.reduce(
  (n, cat) => n + cat.pipelines.filter((p) => p.focus).length,
  0
);

export default function Catalog() {
  const [query, setQuery] = useState("");
  const [focusOnly, setFocusOnly] = useState(false);

  // Filter within categories, then drop categories that end up empty.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return CATALOG.map((cat) => ({
      ...cat,
      pipelines: cat.pipelines.filter((p) => {
        if (focusOnly && !p.focus) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
        );
      }),
    })).filter((cat) => cat.pipelines.length > 0);
  }, [query, focusOnly]);

  const shown = visible.reduce((n, c) => n + c.pipelines.length, 0);

  return (
    <div className="catalog">
      <div className="catalog-intro">
        <p>
          {PIPELINE_COUNT} active nf-core pipelines, grouped by the question they answer.
          Nobody knows all of them — you learn your domain's cluster and ignore the rest.
        </p>
      </div>

      <div className="catalog-controls">
        <input
          className="catalog-search"
          type="search"
          placeholder="Filter by name, description or domain…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className={`focus-toggle ${focusOnly ? "focus-toggle--on" : ""}`}
          onClick={() => setFocusOnly((v) => !v)}
          title="Show only the pipelines on the bacass → funcscan AMR path"
        >
          AMR path ({FOCUS_COUNT})
        </button>
      </div>

      <p className="catalog-count">
        {shown === PIPELINE_COUNT ? `${shown} pipelines` : `${shown} of ${PIPELINE_COUNT} pipelines`}
      </p>

      {visible.map((cat) => (
        <section key={cat.title} className="task-section">
          <div className="section-header-row">
            <h2 className="section-header">{cat.title}</h2>
            <span className="catalog-cat-count">{cat.pipelines.length}</span>
          </div>
          <p className="catalog-blurb">{cat.blurb}</p>

          <div className="catalog-grid">
            {cat.pipelines.map((p) => (
              <a
                key={p.name}
                className={`catalog-card ${p.focus ? "catalog-card--focus" : ""}`}
                href={`https://nf-co.re/${p.name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="catalog-card-top">
                  <span className="catalog-name">{p.name}</span>
                  {p.version && <span className="catalog-version">{p.version}</span>}
                </div>
                <span className="catalog-desc">
                  {p.description || <em>No description published.</em>}
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}

      {visible.length === 0 && (
        <p className="catalog-empty">No pipelines match “{query}”.</p>
      )}
    </div>
  );
}
