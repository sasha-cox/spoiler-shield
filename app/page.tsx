export default function Home() {
  return (
    <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
      <header className="px-4 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">
          Spoiler Shield
        </h1>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="text-zinc-500 text-sm">No VODs ready yet</p>
      </main>
    </div>
  );
}
