import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Application error", error, info);
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
          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>Refresh page</button>
            <a className="secondary-button" href="/login">Go to login</a>
          </div>
        </section>
      </main>
    );
  }
}
