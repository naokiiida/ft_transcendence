import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Users, Trophy, Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <Logo size="lg" />
        <p className="text-center text-lg text-muted-foreground">
          Real-time multiplayer Pong with tournaments
        </p>

        <div className="flex gap-4">
          <Button size="lg" className="glow-primary">
            <Gamepad2 className="mr-2 h-5 w-5" />
            Quick Match
          </Button>
          <Button size="lg" variant="secondary">
            <Bot className="mr-2 h-5 w-5" />
            Play vs AI
          </Button>
        </div>

        <div className="flex gap-2">
          <Badge variant="default">Next.js 15</Badge>
          <Badge variant="secondary">React 19</Badge>
          <Badge variant="outline">shadcn/ui</Badge>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto grid max-w-4xl gap-6 px-4 pb-16 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Multiplayer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Play against real players from around the world with low-latency
            WebSocket connections.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Compete in single-elimination tournaments with bracket tracking and
            leaderboards.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-secondary" />
              AI Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Practice against AI with three difficulty levels and explainable
            decision-making.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
