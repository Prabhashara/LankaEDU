import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true, errorId: window.crypto?.randomUUID?.() || String(Date.now()) };
  }

  componentDidCatch(error, info) {
    console.error("Application error", error, info);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorId: "" });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="page-shell error-shell">
        <section className="detail-panel centered-panel">
          <p className="eyebrow">Recovery</p>
          <h1>Something went wrong</h1>
          <p className="muted-text">The page failed safely. Refresh the page or return to your dashboard.</p>
          {this.state.errorId ? <p className="muted-text">Error ID: {this.state.errorId}</p> : null}
          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>Refresh page</button>
            <a className="secondary-button" href="/login">Go to login</a>
          </div>
        </section>
      </main>
    );
  }
}
