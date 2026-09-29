import React from "react";

/**
 * Catches render-time crashes in the EVOLVE console so the user sees the
 * actual error stack instead of a blank black page. EVOLVE pulls in a large
 * module graph (maplibre-gl, pmtiles, geo data) — any throw during render
 * unmounts the whole tree and leaves a black screen with no clue.
 */
export default class EvolveErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("EVOLVE render crash:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      const stack = this.state.error?.stack || "";
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#05080f",
            color: "#eef3f9",
            padding: 24,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontSize: 12,
            overflow: "auto",
          }}
        >
          <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 12, letterSpacing: "0.08em" }}>
            EVOLVE CONSOLE CRASHED
          </div>
          <div style={{ color: "#22d3ee", marginBottom: 16, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {msg}
          </div>
          {stack && (
            <pre style={{ color: "#7c8a9a", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 11, lineHeight: 1.5 }}>
              {stack}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 16,
              background: "#22d3ee",
              color: "#03070d",
              border: "none",
              padding: "8px 16px",
              borderRadius: 6,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            RELOAD EVOLVE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}