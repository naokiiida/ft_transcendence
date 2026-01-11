"use client";

import { useState } from "react";
import { Button } from "./Button";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex gap-8 py-6">
      <Button onClick={() => setCount(count - 1)}>-1</Button>
      <p className="text-3xl tabular-nums">{count}</p>
      <Button onClick={() => setCount(count + 1)}>+1</Button>
    </div>
  );
}
