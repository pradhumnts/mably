import { Toaster } from "@/components/ui/sonner";

export default function MainLayout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

