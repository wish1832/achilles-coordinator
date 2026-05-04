/// <reference types="vite/client" />

import 'vue-router'

// Augment vue-router's RouteMeta so meta.back is type-checked at every call site.
// See src/router/index.ts for the BackResolver type definition.
declare module 'vue-router' {
  interface RouteMeta {
    back?: import('@/router').BackResolver
  }
}
