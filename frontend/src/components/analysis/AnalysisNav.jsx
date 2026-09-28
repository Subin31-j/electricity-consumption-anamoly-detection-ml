import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

/** Sub-navigation between the three views of a single analysis. */
export function AnalysisNav({ analysisId, base = '/analysis' }) {
  const links = [
    { to: `${base}/${analysisId}/results`, label: 'Results', icon: 'dashboard' },
    { to: `${base}/${analysisId}/visualizations`, label: 'Visualizations', icon: 'chartBar' },
    { to: `${base}/${analysisId}/comparison`, label: 'Model Comparison', icon: 'compare' },
  ];
  return (
    <nav className="analysis-nav" aria-label="Analysis views">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `analysis-nav-link ${isActive ? 'active' : ''}`}>
          <Icon name={l.icon} size={15} />
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AnalysisNav;
