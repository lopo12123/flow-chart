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
        // 子项目必须打包成库模式, 且入口文件名为 [main.js] 供主项目调用
        lib: {
            entry: resolve(__dirname, './src/adaptor.tsx'),
            formats: [ 'es' ],
            fileName: () => 'adaptor.js'
        },
        outDir: "../../dist/packages/flow-chart",
        emptyOutDir: false
    }
})
