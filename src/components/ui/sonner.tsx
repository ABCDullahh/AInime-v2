import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#23293c]/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-[#dce1fb] group-[.toaster]:border group-[.toaster]:border-white/8 group-[.toaster]:border-l-4 group-[.toaster]:border-l-[#f97316] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-[#e0c0b1]/80",
          actionButton: "group-[.toast]:bg-[#f97316] group-[.toast]:text-[#582200] group-[.toast]:rounded-full group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-[#23293c] group-[.toast]:text-[#dce1fb] group-[.toast]:rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
