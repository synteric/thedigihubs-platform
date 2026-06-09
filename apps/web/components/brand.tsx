export function Logo({
  compact = false,
  light = false,
  markOnly = false,
  className = '',
  markClassName = '',
  size = 'default',
}: {
  compact?: boolean;
  light?: boolean;
  markOnly?: boolean;
  className?: string;
  markClassName?: string;
  size?: 'default' | 'large';
}) {
  const markSize = size === 'large' ? 'h-16 w-16' : 'h-11 w-11';
  const wordSize = size === 'large' ? 'text-[34px]' : 'text-2xl';
  const taglineSize = size === 'large' ? 'text-[13px]' : 'text-[11px]';

  return (
    <div className={`flex items-center ${markOnly ? '' : size === 'large' ? 'gap-4' : 'gap-3'} ${className}`}>
      <svg viewBox="0 0 64 64" className={`${markSize} shrink-0 ${markClassName}`} aria-hidden="true">
        <circle cx="32" cy="32" r="5.4" fill="#155EEF" />
        {[
          { x: 32, y: 8, c: '#155EEF' },
          { x: 52, y: 18, c: '#155EEF' },
          { x: 52, y: 46, c: '#F7B500' },
          { x: 32, y: 56, c: '#0D1B4C' },
          { x: 12, y: 46, c: '#155EEF' },
          { x: 12, y: 18, c: '#13B6D8' },
        ].map((p, i) => (
          <g key={i}>
            <line x1="32" y1="32" x2={p.x} y2={p.y} stroke="#155EEF" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <circle cx={p.x} cy={p.y} r="5.3" fill={p.c} />
          </g>
        ))}
        <circle cx="32" cy="32" r="13" fill="none" stroke="#D8ECFF" strokeWidth="2" strokeDasharray="3 5" />
      </svg>
      {!markOnly && <div className="leading-none">
        <p className={`${wordSize} whitespace-nowrap font-black tracking-[-0.045em] ${light ? 'text-white' : 'text-[#0B1744]'}`}>TheDigi<span className="text-[#155EEF]">Hubs</span></p>
        {!compact && <p className={`mt-1 whitespace-nowrap ${taglineSize} font-semibold ${light ? 'text-blue-100' : 'text-slate-500'}`}>Connected Procurement Marketplace</p>}
      </div>}
    </div>
  );
}
