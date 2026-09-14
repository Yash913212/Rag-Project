import { useRef, useState } from 'react';

export default function Tooltip({ label, children, side = 'top' }) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef(null);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const position =
    side === 'top'
      ? 'bottom-full mb-1.5'
      : side === 'bottom'
        ? 'top-full mt-1.5'
        : side === 'right'
          ? 'left-full ml-1.5'
          : 'right-full mr-1.5';

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute ${position} z-50 px-2 py-1 rounded-md bg-surface-4 text-text-primary text-[10px] font-mono tracking-label uppercase shadow-lift whitespace-nowrap pointer-events-none`}
        >
          {label}
        </span>
      )}
    </span>
  );
}