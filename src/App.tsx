import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "./index.css";

export function App() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex justify-center items-center gap-8 mb-8">
        <span className="text-8xl">🏓</span>
      </div>
      <Card className="max-w-md mx-auto">
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">ft_transcendence</CardTitle>
          <CardDescription>
            A real-time multiplayer Pong game built with Bun, Hono, React, and shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Edit <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono">src/App.tsx</code> and save to test HMR
          </p>
          <div className="flex gap-4 justify-center">
            <Button>Play Now</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
