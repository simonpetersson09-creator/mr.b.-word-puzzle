import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
// Locally packaged apps don't render SSR document shells or server-only modules.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: NativeRoot });
function NativeRoot() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}><Outlet /></QueryClientProvider>;
}