import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/recharts")) return "vendor-charts";
                    if (id.includes("node_modules/@tiptap")) return "vendor-editor";
                    if (id.includes("node_modules/framer-motion")) return "vendor-motion";
                    if (id.includes("node_modules/@dnd-kit")) return "vendor-dnd";
                    if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("node_modules/react-router"))
                        return "vendor-react";
                },
            },
        },
    },
});
