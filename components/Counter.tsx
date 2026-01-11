"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex gap-8 py-6 items-center">
      <Button variant="outline" size="icon" onClick={() => setCount(count - 1)}>
        -1
      </Button>
      <p className="text-3xl tabular-nums">{count}</p>
      <Button variant="outline" size="icon" onClick={() => setCount(count + 1)}>
        +1
      </Button>
    </div>
  );
}
