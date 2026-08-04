export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
          Contact
        </h1>

        <div className="space-y-6 text-muted-foreground">
          <p>
            Open to Senior SRE roles. Tampa Bay based, open to remote and
            hybrid.
          </p>

          <div className="space-y-3">
            <a
              href="mailto:luisgimenezdev@gmail.com"
              className="block text-foreground hover:text-primary transition-colors"
            >
              Email →
            </a>
            <a
              href="https://linkedin.com/in/gimenezdev"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:text-primary transition-colors"
            >
              LinkedIn →
            </a>
            <a
              href="https://github.com/menezmethod"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:text-primary transition-colors"
            >
              GitHub →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
