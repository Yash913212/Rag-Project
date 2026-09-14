export default function AmbientBackground({ intensify = false }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Aurora blobs */}
      <div className="absolute w-[40rem] h-[40rem] -top-40 -left-40 rounded-full bg-accent-primary/[0.06] blur-[120px] animate-subtle-glow" />
      <div className="absolute w-[32rem] h-[32rem] top-1/3 -right-32 rounded-full bg-accent-glow/[0.05] blur-[110px] animate-subtle-glow" style={{ animationDelay: '3s' }} />
      <div className="absolute w-[28rem] h-[28rem] -bottom-48 left-1/3 rounded-full bg-status-success/[0.03] blur-[100px] animate-subtle-glow" style={{ animationDelay: '5s' }} />

      {/* Grid + noise */}
      <div className="absolute inset-0 bg-grid-lines" />
      <div className={`absolute inset-0 bg-noise ${intensify ? 'opacity-[0.05]' : 'opacity-[0.025]'}`} />
    </div>
  );
}