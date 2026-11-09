import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const raiz = import.meta.dirname
// Páginas do blog são geradas por scripts/blog.mjs antes do build
const blog = Object.fromEntries(
  readdirSync(resolve(raiz, 'blog')).filter((f) => f.endsWith('.html'))
    .map((f) => [`blog/${f.replace('.html', '')}`, resolve(raiz, 'blog', f)]),
)

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(raiz, 'index.html'),
        privacidade: resolve(raiz, 'politica-de-privacidade.html'),
        ...blog,
      },
    },
  },
})
