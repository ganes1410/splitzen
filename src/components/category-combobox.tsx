import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryComboboxProps {
  categories: { _id: string; name: string; color: string }[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCreateCategory: (categoryName: string) => Promise<string | null>;
}

export function CategoryCombobox({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCreateCategory = async () => {
    if (newCategoryName.trim() !== "") {
      const newCategoryId = await onCreateCategory(newCategoryName.trim());
      if (newCategoryId) {
        onSelectCategory(newCategoryId);
        setNewCategoryName("");
        setOpen(false);
      }
    }
  };

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c._id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategory ? (
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: selectedCategory.color }}
              />
              {selectedCategory.name}
            </div>
          ) : (
            "Select category"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search or create category..." />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-2">No category found.</p>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Create a new one..."
                  className="mb-2"
                />
                <Button onClick={handleCreateCategory} className="w-full">
                  Create Category
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category._id}
                  value={category.name}
                  onSelect={() => {
                    onSelectCategory(category._id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCategoryId === category._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
