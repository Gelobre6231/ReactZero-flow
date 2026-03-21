import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { EasingProvider } from "./context/EasingContext";
import "./global.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<EasingProvider>
			<App />
		</EasingProvider>
	</StrictMode>,
);
