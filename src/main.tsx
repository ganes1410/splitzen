import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

// Inject theme script to prevent flicker
const themeScript = document.createElement('script');
themeScript.innerHTML = `
  const savedTheme = localStorage.getItem('theme');
  console.log("Script: savedTheme", savedTheme);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log("Script: prefersDark", prefersDark);

  if (savedTheme) {
    document.documentElement.classList.add(savedTheme);
    console.log("Script: Applying saved theme", savedTheme);
  } else if (prefersDark) {
    document.documentElement.classList.add('dark');
    console.log("Script: Applying dark theme from system preference");
  } else {
    document.documentElement.classList.add('light');
    console.log("Script: Applying light theme by default");
  }
`;
document.head.prepend(themeScript);

root.render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <RouterProvider router={router} />
      </ConvexProvider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
