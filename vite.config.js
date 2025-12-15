// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// cart-app/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

// cart-app/vite.config.js
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "fsBoard",
      filename: "remoteEntry.js",
      exposes: {
        "./fsBoard": "./src/fsBoard.tsx",
        // "./Cart": "./src/Cart.tsx",
        // "./cartStore": "./src/cartStore.ts", // expose!
      },
      shared: ["react", "react-dom", "zustand"],
    }),
  ],
  preview: {
    port: 5003,
    strictPort: true,
  },

  server: {
    port: 5003,
    strictPort: true,
  },
});
