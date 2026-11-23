import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './root';
import { Route as indexRoute } from '../routes/index';

// Native packages contain the unchanged game, not web-only administration/server code.
const gameRoute = createRoute({
  ...indexRoute.options,
  getParentRoute: () => rootRoute,
  path: '/',
});
export const routeTree = rootRoute.addChildren([gameRoute]);