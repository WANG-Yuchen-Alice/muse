import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Gallery from "./pages/Gallery";
import Share from "./pages/Share";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/create" component={Home} />
      <Route path="/results" component={Results} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/share/:trackId" component={Share} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.16 0.02 280 / 80%)",
                backdropFilter: "blur(20px)",
                border: "1px solid oklch(1 0 0 / 8%)",
                color: "oklch(0.93 0.01 280)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
