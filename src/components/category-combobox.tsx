import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateCategory = async () => {
    if (searchQuery.trim() !== "") {
      const newCategoryId = await onCreateCategory(searchQuery.trim());
      if (newCategoryId) {
        onSelectCategory(newCategoryId);
        setSearchQuery("");
        setOpen(false);
      }
    }
  };

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c._id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const showCreateButton = searchQuery && !filteredCategories.some(c => c.name.toLowerCase() === searchQuery.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-11 justify-between"
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
          <CommandInput
            placeholder="Search or create category..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category._id}
                  value={category.name}
                  onSelect={() => {
                    onSelectCategory(category._id);
                    setSearchQuery("");
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
              {showCreateButton && (
                <CommandItem
                  onSelect={handleCreateCategory}
                  className="text-primary cursor-pointer"
                >
                  Create "{searchQuery}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
