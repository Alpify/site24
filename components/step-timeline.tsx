type Step = { title: string; description: string };

export function StepTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative mx-auto max-w-3xl space-y-10 border-l border-border pl-8">
      {steps.map((step, i) => (
        <li key={step.title} className="relative">
          <span className="absolute -left-[39px] top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-accent">
            {i + 1}
          </span>
          <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
