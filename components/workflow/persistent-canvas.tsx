"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkflowCanvas } from "./workflow-canvas";

export function PersistentCanvas() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show canvas on homepage and workflow pages
  const showCanvas = pathname === "/" || pathname.startsWith("/workflows/");

  if (!(isMounted && showCanvas)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0">
      <WorkflowCanvas />
    </div>
  );
}
