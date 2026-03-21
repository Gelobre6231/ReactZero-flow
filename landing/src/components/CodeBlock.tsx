import { useRef, useEffect, useState, useCallback } from "react";

declare const Prism: { highlightElement(el: Element): void };

interface CodeBlockProps {
	code: string;
	language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
	const codeRef = useRef<HTMLElement>(null);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (codeRef.current && typeof Prism !== "undefined") {
			Prism.highlightElement(codeRef.current);
		}
	}, [code]);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(code.trim());
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div className="code-block-wrapper">
			<button
				type="button"
				className="code-copy-btn"
				onClick={handleCopy}
			>
				{copied ? "Copied!" : "Copy"}
			</button>
			<pre>
				<code ref={codeRef} className={`language-${language}`}>
					{code.trim()}
				</code>
			</pre>
		</div>
	);
}
