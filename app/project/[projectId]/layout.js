import { Toaster } from "@/components/ui/sonner";

export default function ProjectLayout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}


