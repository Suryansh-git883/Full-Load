import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter } from "wouter";
import HomePage from "@/pages/home";
import BatchPage from "@/pages/batch";
import SubjectPage from "@/pages/subject";
import TopicPage from "@/pages/topic";
import WatchPage from "@/pages/watch";
import LivePage from "@/pages/live";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/batch/:batchId" component={BatchPage} />
      <Route path="/batch/:batchId/subject/:subjectId" component={SubjectPage} />
      <Route path="/batch/:batchId/subject/:subjectId/topic/:topicId" component={TopicPage} />
      <Route path="/watch" component={WatchPage} />
      <Route path="/live" component={LivePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
