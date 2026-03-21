import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "Flow",
			formats: ["es"],
			fileName: () => "index.js",
		},
		rollupOptions: {
			external: ["react", "react/jsx-runtime"],
		},
		sourcemap: true,
		target: "es2022",
		minify: false,
	},
});
