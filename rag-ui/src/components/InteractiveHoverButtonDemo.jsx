import { InteractiveHoverButton } from './ui/InteractiveHoverButton';

function InteractiveHoverButtonDemo() {
  return (
    <div className="relative flex flex-col items-center gap-6 justify-center p-10">
      <InteractiveHoverButton text="Small" size="sm" />
      <InteractiveHoverButton text="Medium" size="md" />
      <InteractiveHoverButton text="Large" size="lg" />
      <InteractiveHoverButton text="Full Width" fullWidth className="max-w-sm" />
    </div>
  );
}

export { InteractiveHoverButtonDemo };
export default InteractiveHoverButtonDemo;