/**
 * Accessibility conformance check: ensures every routed page has an <h1>.
 *
 * Screen reader users rely on a level-one heading to orient themselves when
 * landing on a new page. This script reads the app router, discovers all
 * views wired up as routes, and verifies each one contains an <h1> element.
 * It exits with a non-zero code if any are missing, making it suitable as a
 * CI gate.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const routerPath = resolve('src/router/index.ts')
const routerContents = readFileSync(routerPath, 'utf8')

/**
 * Remove block comments and single-line comments from source text so that
 * commented-out routes are not picked up as false positives.
 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Parse the router source to find every Vue view that is imported as a route.
 * Handles both static imports (`from '@/views/...'`) and lazy/dynamic imports
 * (`import('@/views/...')`). Returns sorted absolute file paths.
 */
function getRoutedViewPaths(source) {
  const viewPaths = new Set()
  const uncommentedSource = stripComments(source)

  // Match static imports, e.g. `import FooView from '@/views/FooView.vue'`
  const staticImportPattern = /from ['"]@\/views\/([^'"]+\.vue)['"]/g
  // Match lazy imports, e.g. `() => import('@/views/FooView.vue')`
  const lazyImportPattern = /import\(['"]@\/views\/([^'"]+\.vue)['"]\)/g

  for (const pattern of [staticImportPattern, lazyImportPattern]) {
    for (const match of uncommentedSource.matchAll(pattern)) {
      viewPaths.add(resolve('src/views', match[1]))
    }
  }

  return [...viewPaths].sort()
}

/**
 * Read each routed view file and check that it contains an <h1> element.
 * If any views are missing a heading, list them and set a failing exit code.
 */
function assertAllRoutedViewsHaveH1(viewPaths) {
  const missingHeadings = []

  for (const viewPath of viewPaths) {
    const fileContents = readFileSync(viewPath, 'utf8')

    // Routed pages need a level-one heading so screen reader users can orient quickly.
    if (!/<h1\b/i.test(fileContents)) {
      missingHeadings.push(viewPath)
    }
  }

  // Report failures or print a success summary.
  if (missingHeadings.length > 0) {
    console.error('Routed views missing an <h1>:')
    for (const viewPath of missingHeadings) {
      console.error(`- ${viewPath}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Verified ${viewPaths.length} routed views include an <h1>.`)
}

// Discover all routed views and validate them.
const routedViewPaths = getRoutedViewPaths(routerContents)

// Sanity check: if no views were found, the parsing logic may be broken.
if (routedViewPaths.length === 0) {
  throw new Error(`No routed views found in ${routerPath}`)
}

assertAllRoutedViewsHaveH1(routedViewPaths)
