/** Clearly labels demo/prototype consumer data per PRD requirements. */
export function DemoBadge({ children = 'DEMO / PROTOTYPE DATA' }) {
  return (
    <span className="ui-demo-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <circle cx="12" cy="12" r="6" />
      </svg>
      {children}
    </span>
  );
}

export default DemoBadge;
