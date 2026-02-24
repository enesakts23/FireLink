import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const GlassPanel = forwardRef(
  ({ children, className = '', variant = 'default', animated = true, hover = false, onClick, ...props }, ref) => {
    const variantClass = {
      default: 'glass hud-panel',
      strong: 'glass-strong hud-panel',
      subtle: 'glass-subtle hud-panel',
      dark: 'glass-dark hud-panel',
      accent: 'glass hud-panel border-primary/20',
      warning: 'glass hud-panel border-warning/20',
      critical: 'glass hud-panel border-danger/20',
      success: 'glass hud-panel border-success/20',
      orange: 'bg-gradient-to-br from-accent-bg to-orange-500 border-transparent text-white rounded-2xl',
    };

    const hoverStyles = hover ? 'hover:scale-[1.01]' : '';
    const combinedClassName = `relative transition-all duration-200 ${variantClass[variant] || variantClass.default} ${hoverStyles} ${onClick ? 'cursor-pointer' : ''} ${className}`;

    const motionProps = animated
      ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } } }
      : {};

    if (animated) {
      return (
        <motion.div ref={ref} className={combinedClassName} onClick={onClick} {...motionProps}>
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={combinedClassName} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

export function GlassCard({ title, subtitle, icon: Icon, children, headerRight, variant = 'default', className = '', ...props }) {
  return (
    <GlassPanel variant={variant} className={`p-4 ${className}`} {...props}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-8 h-8 rounded-[10px] bg-primary-lighter flex items-center justify-center text-primary">
                <Icon size={16} />
              </div>
            )}
            <div>
              {title && <h3 className="font-display font-semibold text-text-primary text-sm">{title}</h3>}
              {subtitle && <p className="text-[10px] text-text-tertiary mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </GlassPanel>
  );
}

export function GlassDivider({ className = '' }) {
  return <div className={`h-px bg-border my-3 ${className}`} />;
}

export default GlassPanel;
