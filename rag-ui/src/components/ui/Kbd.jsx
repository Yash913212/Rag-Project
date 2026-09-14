export default function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-[1.4rem] px-1 rounded-md bg-surface-2 border border-border-default border-b-2 font-mono text-[10px] text-text-secondary shadow-card">
      {children}
    </kbd>
  );
}