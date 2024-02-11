import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

export default defineConfig({
    base: "./",
    plugins: [
        babel({
            babelConfig: {
                babelrc: false,
                configFile: false,
                plugins: [
                    [
                        "@babel/plugin-proposal-decorators",
                        { loose: true, version: "2022-03" },
                    ],
                ],
            },
        }),
    ],
    server: {
        host: true,
        port: 3001,
        open: "/",
    },
    test: {
        globals: true,
    },
});
