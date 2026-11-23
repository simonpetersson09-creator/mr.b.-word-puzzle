import {QueryClient} from '@tanstack/react-query';
import {createRouter,rootRouteId} from '@tanstack/react-router';
import {describe,it,expect} from 'vitest';
import {routeTree} from './route-tree';

describe('Native offline routing',()=>{
  it('retains the game at / without adding the web-only admin page',()=>{
    const router=createRouter({routeTree,context:{queryClient:new QueryClient()}});
    expect(router.matchRoutes('/').at(-1)?.routeId).toBe('/');
    expect(router.matchRoutes('/admin').at(-1)?.routeId).toBe(rootRouteId);
  });
});