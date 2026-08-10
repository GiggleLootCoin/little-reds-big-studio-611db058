/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is generated from the files in src/routes.
// Keep it synchronized with the route directory; the build may regenerate it.

import { Route as rootRouteImport } from './routes/__root'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as IndexRouteImport } from './routes/index'
import { Route as VoiceLabRouteImport } from './routes/voice-lab'

const AuthRoute = AuthRouteImport.update({
  id: '/auth',
  path: '/auth',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const VoiceLabRoute = VoiceLabRouteImport.update({
  id: '/voice-lab',
  path: '/voice-lab',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/voice-lab': typeof VoiceLabRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/voice-lab': typeof VoiceLabRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/voice-lab': typeof VoiceLabRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/auth' | '/voice-lab'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/auth' | '/voice-lab'
  id: '__root__' | '/' | '/auth' | '/voice-lab'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthRoute: typeof AuthRoute
  VoiceLabRoute: typeof VoiceLabRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/auth': {
      id: '/auth'
      path: '/auth'
      fullPath: '/auth'
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/voice-lab': {
      id: '/voice-lab'
      path: '/voice-lab'
      fullPath: '/voice-lab'
      preLoaderRoute: typeof VoiceLabRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthRoute: AuthRoute,
  VoiceLabRoute: VoiceLabRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
