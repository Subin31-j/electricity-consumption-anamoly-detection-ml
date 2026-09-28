import { StatCard } from '../../components/ui/StatCard';

/** Admin KPI card - shared StatCard styled by the admin (dark) theme. */
export default function AdminStatCard({ label, value, tone = 'default', icon, hint, spark }) {
  return <StatCard label={label} value={value ?? 0} tone={tone} icon={icon} hint={hint} spark={spark} />;
}
