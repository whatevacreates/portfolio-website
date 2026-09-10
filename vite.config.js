import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every built asset URL relative, so the site works both at
// a domain root and under a project subpath (github.io/portfolio-website/).
// The app uses hash routing, so the document path never changes and relative
// URLs stay valid on every "page".
export default defineConfig({
  base: './',
  plugins: [react()],
});
