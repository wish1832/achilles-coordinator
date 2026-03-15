import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const routerPath = resolve('src/router/index.ts')
const routerContents = readFileSync(routerPath, 'utf8')

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function getRoutedViewPaths(source) {
  const viewPaths = new Set()
  const uncommentedSource = stripComments(source)

  const staticImportPattern = /from ['"]@\/views\/([^'"]+\.vue)['"]/g
  const lazyImportPattern = /import\(['"]@\/views\/([^'"]+\.vue)['"]\)/g

  for (const pattern of [staticImportPattern, lazyImportPattern]) {
    for (const match of uncommentedSource.matchAll(pattern)) {
      viewPaths.add(resolve('src/views', match[1]))
    }
  }

  return [...viewPaths].sort()
}

function assertAllRoutedViewsHaveH1(viewPaths) {
  const missingHeadings = []

  for (const viewPath of viewPaths) {
    const fileContents = readFileSync(viewPath, 'utf8')

    // Routed pages need a level-one heading so screen reader users can orient quickly.
    if (!/<h1\b/i.test(fileContents)) {
      missingHeadings.push(viewPath)
    }
  }

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

const routedViewPaths = getRoutedViewPaths(routerContents)

if (routedViewPaths.length === 0) {
  throw new Error(`No routed views found in ${routerPath}`)
}

assertAllRoutedViewsHaveH1(routedViewPaths)
