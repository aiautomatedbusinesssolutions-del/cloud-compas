import CloudCompassApp from "@/components/CloudCompassApp";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            Cloud Compass
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            A Beginner&apos;s Lens for Ichimoku Analysis
          </p>
        </header>

        <CloudCompassApp />

        <footer className="mt-8 border-t border-slate-800 pt-4 text-center">
          <p className="text-xs text-slate-500">
            For educational purposes only. This is not financial advice. Past
            patterns do not guarantee future results.
          </p>
        </footer>
      </div>
    </main>
  );
}
