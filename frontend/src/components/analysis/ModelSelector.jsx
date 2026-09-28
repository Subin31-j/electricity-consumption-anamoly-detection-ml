import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

export const ALL_MODELS = ['isolation_forest', 'kmeans', 'lof'];

const MODELS = [
  {
    id: 'isolation_forest',
    name: 'Isolation Forest',
    role: 'Primary model',
    icon: 'tree',
    color: '#2563eb',
    purpose: 'Keeps the main focus on detecting unusual observations in high-dimensional data.',
    tech: '100 trees · contamination 5% · random_state 42',
    locked: true,
  },
  {
    id: 'kmeans',
    name: 'K-Means',
    role: 'Comparison model',
    icon: 'clusters',
    color: '#0891b2',
    purpose: 'Groups similar consumption behavior.',
    tech: 'Distance-to-centroid scoring · contamination 5%',
  },
  {
    id: 'lof',
    name: 'Local Outlier Factor',
    role: 'Comparison model',
    icon: 'radar',
    color: '#7c3aed',
    purpose: 'Identifies observations that differ from their local neighborhood.',
    tech: 'Local density ratio · up to 20 neighbours · contamination 5%',
  },
];

/**
 * Model selection cards. Isolation Forest is the primary model and always
 * runs; comparison models can be toggled. The selected list is passed to the
 * existing analysis endpoints via their `models` parameter (default: all three).
 */
export function ModelSelector({ value, onChange, disabled }) {
  const toggle = (id) => {
    if (disabled) return;
    const next = value.includes(id) ? value.filter((m) => m !== id) : [...value, id];
    onChange(ALL_MODELS.filter((m) => next.includes(m)));
  };

  return (
    <fieldset className="model-select" disabled={disabled}>
      <legend className="sr-only">Models to run</legend>
      {MODELS.map((m) => {
        const checked = value.includes(m.id);
        return (
          <label
            key={m.id}
            className={`model-option ${checked ? 'is-selected' : ''} ${m.locked ? 'is-locked' : ''}`}
            style={{ '--model-color': m.color }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={m.locked || disabled}
              onChange={() => toggle(m.id)}
              aria-describedby={`mdesc-${m.id}`}
            />
            <span className="model-option-check" aria-hidden="true">
              <Icon name="check" size={13} strokeWidth={3} />
            </span>
            <span className="model-icon">
              <Icon name={m.icon} size={20} />
            </span>
            <span className="model-option-body">
              <span className="model-option-head">
                <strong>{m.name}</strong>
                <Badge tone={m.locked ? 'primary' : 'outline'}>{m.role}</Badge>
              </span>
              <span className="model-option-purpose" id={`mdesc-${m.id}`}>
                {m.purpose}
                {m.locked && ' Always included.'}
              </span>
              <code className="model-option-tech">{m.tech}</code>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export default ModelSelector;
