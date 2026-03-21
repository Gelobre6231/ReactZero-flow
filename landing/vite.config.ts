import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
	plugins: [react()],
	base: "/ReactZero-Flow/",
	root: resolve(__dirname),
	resolve: {
		alias: {
			"@flow": resolve(__dirname, "../src"),
		},
	},
	server: {
		port: 3000,
		open: true,
	},
	build: {
		outDir: resolve(__dirname, "dist"),
		emptyOutDir: true,
	},
});
