import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FilterChip {
  id: string;
  label: string;
  active?: boolean;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onToggle: (id: string) => void;
  className?: string;
  variant?: 'default' | 'quick-refine';
}

export function FilterChips({ chips, onToggle, className, variant = 'default' }: FilterChipsProps) {
  if (variant === 'quick-refine') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {chips.map((chip) => (
          <Button
            key={chip.id}
            variant={chip.active ? "coral" : "outline"}
            size="sm"
            onClick={() => onToggle(chip.id)}
            className="rounded-full"
          >
            {chip.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onToggle(chip.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
            chip.active 
              ? "bg-coral text-primary-foreground shadow-sm" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export function QuickRefineChips({ 
  onRefine, 
  className 
}: { 
  onRefine: (refinement: string) => void;
  className?: string;
}) {
  const refinements = [
    { id: 'modern-2020', label: 'Lebih modern (>=2020)' },
    { id: 'short', label: 'Lebih pendek (<=13 eps)' },
    { id: 'cozy', label: "Lebih 'cozy'" },
    { id: 'action', label: 'Lebih action' },
    { id: 'no-romance', label: 'Minim romance' },
    { id: 'safe', label: 'Exclude: gore/ecchi' },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-sm text-muted-foreground">Quick refine:</span>
      <div className="flex flex-wrap gap-2">
        {refinements.map((ref) => (
          <Button
            key={ref.id}
            variant="outline"
            size="sm"
            onClick={() => onRefine(ref.id)}
            className="rounded-full hover:border-coral hover:text-coral"
          >
            {ref.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
