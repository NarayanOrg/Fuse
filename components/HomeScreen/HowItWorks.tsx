const steps = [
  {
    title: "Write your message",
    description: "Add the note you want to share and choose a fuse from 10 seconds to one hour.",
  },
  {
    title: "Share one private link",
    description: "Send the link to your recipient. The message stays hidden until they reveal it.",
  },
  {
    title: "Let the fuse run out",
    description: "The countdown starts on reveal. The message is deleted when the timer ends.",
  },
]

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-12"
    >
      <h2 id="how-it-works-title" className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        How Fuse works
      </h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold text-primary">Step {index + 1}</p>
            <h3 className="mt-2 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
