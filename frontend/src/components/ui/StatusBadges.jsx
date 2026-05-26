import { ANIMAL_STATUS_CONFIG, DISTRIBUTION_STATUS_CONFIG } from '../../utils/helpers';

export const AnimalStatusBadge = ({ status }) => {
  const config = ANIMAL_STATUS_CONFIG[status] || ANIMAL_STATUS_CONFIG.registered;
  return (
    <span className={config.color + ' badge'}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const DistributionStatusBadge = ({ status }) => {
  const config = DISTRIBUTION_STATUS_CONFIG[status] || DISTRIBUTION_STATUS_CONFIG.not_ready;
  return (
    <span className={config.color + ' badge'}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const AnimalStatusPipeline = ({ status }) => {
  const statuses = ['registered', 'ready', 'slaughtered', 'processed', 'distributed'];
  const currentIdx = statuses.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {statuses.map((s, i) => {
        const config = ANIMAL_STATUS_CONFIG[s];
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
              ${isCurrent ? 'bg-emerald-600 text-white scale-110 shadow-lg' : ''}
              ${isCompleted ? 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : ''}
              ${!isCurrent && !isCompleted ? 'bg-stone-100 text-stone-400 dark:bg-stone-800' : ''}
            `}>
              {isCompleted ? '✓' : i + 1}
            </div>
            {i < statuses.length - 1 && (
              <div className={`h-0.5 w-4 rounded ${isCompleted ? 'bg-emerald-400' : 'bg-stone-200 dark:bg-stone-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};
