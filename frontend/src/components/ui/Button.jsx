import { Link } from 'react-router-dom';
import { Icon } from './Icon';

const VARIANT = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  dark: 'btn-dark',
};

function classes(variant, size, block, className) {
  return [
    VARIANT[variant] || VARIANT.primary,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function Inner({ icon, iconRight, loading, children }) {
  return (
    <>
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={16} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={16} />}
    </>
  );
}

/** Accessible button with variants, sizes, optional icon and loading state. */
export function Button({
  variant = 'primary',
  size,
  block,
  icon,
  iconRight,
  loading = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={classes(variant, size, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Inner icon={icon} iconRight={iconRight} loading={loading}>{children}</Inner>
    </button>
  );
}

/** Router link styled as a button. */
export function ButtonLink({ to, variant = 'primary', size, block, icon, iconRight, className = '', children, ...rest }) {
  return (
    <Link to={to} className={classes(variant, size, block, className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight}>{children}</Inner>
    </Link>
  );
}

export default Button;
