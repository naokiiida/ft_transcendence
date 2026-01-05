import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <div className="container mx-auto p-8 text-center">
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
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/login">Play Now</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/privacy">Privacy Policy</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
