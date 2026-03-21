import { useState, type ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";

interface ExampleCardProps {
	title: string;
	description: string;
	code: string;
	children: ReactNode;
	controls?: ReactNode;
}

export function ExampleCard({
	title,
	description,
	code,
	children,
	controls,
}: ExampleCardProps) {
	const [showCode, setShowCode] = useState(false);

	return (
		<div className="example-card">
			<div className="example-card-header">
				<div>
					<div className="example-card-title">{title}</div>
					<div className="example-card-desc">{description}</div>
				</div>
				<div className="example-card-controls">
					{controls}
					<button
						type="button"
						className="btn btn-code"
						onClick={() => setShowCode(!showCode)}
					>
						{showCode ? "</>" : "</>"}
					</button>
				</div>
			</div>
			<div className="example-card-demo">{children}</div>
			{showCode && (
				<div className="example-card-code">
					<CodeBlock code={code} />
				</div>
			)}
		</div>
	);
}
