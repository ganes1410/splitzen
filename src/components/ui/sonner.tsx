import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          error: "bg-destructive text-destructive-foreground",
          success: "bg-green-900 text-white",
          toast:
            "flex items-center gap-2 border-border shadow-sm p-4 rounded-lg",
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
};

export { Toaster };
