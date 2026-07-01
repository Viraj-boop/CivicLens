import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[CivicLens]", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] grid place-items-center p-6">
          <div className="surface-card p-8 max-w-md text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground break-words">{this.state.error.message}</p>
            <Button className="mt-6" onClick={() => this.setState({ error: null })}>Try again</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
