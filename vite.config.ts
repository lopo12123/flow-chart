import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [ react() ],
    css: {
        modules: {
            localsConvention: 'camelCaseOnly'
        },
        preprocessorOptions: {
            scss: {
                javascriptEnabled: true
            }
        }
    },
    resolve: {
        alias: {
            "@flowChart": path.resolve('./src')
        }
    },
    server: {
        port: 8899
    },
    build: {
        outDir: './dist'
    }
})
