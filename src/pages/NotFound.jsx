function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center text-[#c8d7dc]">
      <div className="glass-panel rounded-2xl px-10 py-12 text-center shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="font-mono text-[9px] tracking-[0.2em] text-[#556d7a]">
          SYS / 404
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-[0.12em] text-[#f0f6f8]">
          PAGE NOT FOUND
        </h1>
        <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-[#7893a0]">
          The requested DNS route is unavailable.
        </p>
      </div>
    </main>
  )
}

export default NotFound
