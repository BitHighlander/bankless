import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

// @ts-ignore
export default defineConfig(({}) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // const env = loadEnv(mode, process.cwd(), '')
  return {
    // vite config
    define: {
      'process.env': {},
    },
    plugins: [react()],
    resolve: {
      alias: {
        lib: resolve(__dirname, "src/lib"),
        routes: resolve(__dirname, "src/routes"),
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        sys: 'util',
        events: 'rollup-plugin-node-polyfills/polyfills/events',
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
        path: 'rollup-plugin-node-polyfills/polyfills/path',
        querystring: 'rollup-plugin-node-polyfills/polyfills/qs',
        punycode: 'rollup-plugin-node-polyfills/polyfills/punycode',
        url: 'rollup-plugin-node-polyfills/polyfills/url',
        string_decoder: 'rollup-plugin-node-polyfills/polyfills/string-decoder',
        http: 'rollup-plugin-node-polyfills/polyfills/http',
        https: 'rollup-plugin-node-polyfills/polyfills/http',
        os: 'rollup-plugin-node-polyfills/polyfills/os',
        assert: 'rollup-plugin-node-polyfills/polyfills/assert',
        constants: 'rollup-plugin-node-polyfills/polyfills/constants',
        _stream_duplex:
            'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
        _stream_passthrough:
            'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
        _stream_readable:
            'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
        _stream_writable:
            'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
        _stream_transform:
            'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
        timers: 'rollup-plugin-node-polyfills/polyfills/timers',
        console: 'rollup-plugin-node-polyfills/polyfills/console',
        vm: 'rollup-plugin-node-polyfills/polyfills/vm',
        zlib: 'rollup-plugin-node-polyfills/polyfills/zlib',
        tty: 'rollup-plugin-node-polyfills/polyfills/tty',
        domain: 'rollup-plugin-node-polyfills/polyfills/domain',
        process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true
          }),
          NodeModulesPolyfillPlugin()
        ],
      }
    },
    build: {
      minify: false,
      rollupOptions: {
        external: [
          /^node:.*/,
          ""
        ],
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true
          }),
          rollupNodePolyFill()
        ],
      }
    },
  }
})