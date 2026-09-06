"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="outline" type="button" onClick={() => window.print()}>
      <Printer className="h-3.5 w-3.5" strokeWidth={2} />
      Yazdır / PDF
    </Button>
  );
}
