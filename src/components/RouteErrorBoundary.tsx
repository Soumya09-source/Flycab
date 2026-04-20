import React from "react";

export class RouteErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { 
    return { hasError: true, error }; 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", border: "1px solid red", background: "#fff0f0", color: "#a00", margin: "1rem" }}>
          <h2>A specific route component crashed</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
