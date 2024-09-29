import { defineConfig, loadEnv } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { resolve } from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    // vite allows access to environment variables prefixed with VITE_
    // in order to access other environment variables, we need to pass them in here
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.ENABLE_TWITTER_WIDGETS": JSON.stringify(env.ENABLE_TWITTER_WIDGETS),
      "process.env.EMBED_SERVICE_HOSTNAME": JSON.stringify(env.EMBED_SERVICE_HOSTNAME),
      "process.env.WEBPACK_SERVER": JSON.stringify(env.WEBPACK_SERVER),
      "process.env.FIP_REPO_OWNER": JSON.stringify(env.FIP_REPO_OWNER),
      "process.env.FIP_REPO_NAME": JSON.stringify(env.FIP_REPO_NAME),
    },
    plugins: [nodePolyfills({ globals: { Buffer: true } })],
    assetsInclude: ["**/*.md"],
    build: {
      rollupOptions: {
        external: ["@theme-ui/css"],
      },
    },
    server: {
      port: 8080,
      proxy: {
        "/api": {
          target: "http://localhost:8040",
          // secure: false,
          changeOrigin: true,
        },
      },
    },
  }
})
