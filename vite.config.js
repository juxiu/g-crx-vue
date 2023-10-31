import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import babel from 'vite-plugin-babel';
import path from 'path'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const manifest = require('./src/chrome/manifest.json')

import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /@\//,
        replacement: `${path.resolve(process.cwd(), 'src')}/`,
      },
    ]
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        format: 'umd',
      },
    },
    cssCodeSplit: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element/index.scss" as *;`,
      },
    },
  },

  plugins: [
    vue(),
    babel(),
    viteStaticCopy({
      targets: [
        {
          src: './src/chrome/background.js',
          dest: ''
        },
        {
          src: './src/assets/*',
          dest: 'assets/icons'
        }
      ]
    }),
    {
      name: "render-manifest",
      generateBundle(options, bundle,) {
        for (const [key, value] of Object.entries(bundle)) {
          if (value.isEntry) {
            manifest.content_scripts[0].js[0] = '/' + key
            this.emitFile({
              type: 'asset',
              fileName: 'manifest.json',
              source: JSON.stringify(manifest)
            })
          }
        }
      }
    },
    AutoImport({
      resolvers: [ElementPlusResolver({
        importStyle: 'sass',
      })],
    }),
    Components({
      resolvers: [ElementPlusResolver({
        importStyle: 'sass',
      })],
    })
  ],
})
