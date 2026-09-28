import { useRef } from 'react';

/**
 * Segmented tab control with roving arrow-key navigation.
 * options: [{ value, label }]
 */
export function Tabs({ options, value, onChange, label = 'Options', size, className = '' }) {
  const refs = useRef([]);

  const onKeyDown = (e, idx) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % options.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + options.length) % options.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = options.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className={`tabs ${size === 'lg' ? 'tabs-lg' : ''} ${className}`} role="tablist" aria-label={label}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            className="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
