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

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
}

interface MultiSelectProps<T = string> {
  options: MultiSelectOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
  onRemove?: (value: T) => void;
  className?: string;
  getKey?: (value: T) => string | number; // optional for custom keys
}

export function createMultiSelect<T = string>() {
  return React.forwardRef<HTMLButtonElement, MultiSelectProps<T>>(
    (
      { options, selected, onChange, onRemove, className, getKey, ...props },
      ref
    ) => {
      const getValueKey = (value: T) =>
        getKey ? getKey(value) : String(value);

      const handleSelect = (value: T) => {
        const exists = selected.some(
          (v) => getValueKey(v) === getValueKey(value)
        );
        if (exists) {
          onChange(
            selected.filter((v) => getValueKey(v) !== getValueKey(value))
          );
        } else {
          onChange([...selected, value]);
        }
      };

      return (
        <div className={cn("w-full", className)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-foreground  text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
              {options.map((option) => {
                const checked = selected.some(
                  (v) => getValueKey(v) === getValueKey(option.value)
                );
                return (
                  <DropdownMenuItem
                    key={getValueKey(option.value)}
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                    className="flex items-center"
                  >
                    <Checkbox checked={checked} className="mr-2" />
                    {option.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((value) => {
              const option = options.find(
                (o) => getValueKey(o.value) === getValueKey(value)
              );
              return (
                option && (
                  <div
                    key={getValueKey(value)}
                    className="flex items-center rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                  >
                    {option.label}
                    {onRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(value)}
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
}

// ✅ Create a typed instance:
const MultiSelect = createMultiSelect();

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
