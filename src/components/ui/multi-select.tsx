import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onRemove?: (value: string) => void; // New prop for removal
  className?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, selected, onChange, onRemove, className, ...props }, ref) => {
    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
      } else {
        onChange([...selected, value]);
      }
    };

    const handleRemove = (value: string) => {
      onRemove?.(value);
    };

    return (
      <div className={cn("w-full", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
              )}
              ref={ref}
              {...props}
            >
              <span className="truncate">
                {selected.length > 0
                  ? `${selected.length} selected`
                  : "Select options"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e) => e.preventDefault()}
                onClick={() => handleSelect(option.value)}
                className="flex items-center"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  className="mr-2"
                />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((value) => {
            const option = options.find((o) => o.value === value);
            return (
              option && (
                <div
                  key={value}
                  className="flex items-center rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                >
                  {option.label}
                  {onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(value)}
                      className="ml-1 h-auto p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )
            );
          })}
        </div>
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
