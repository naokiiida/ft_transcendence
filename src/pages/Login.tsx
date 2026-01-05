import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  return (
    <div className="container mx-auto p-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Pong</CardTitle>
          <CardDescription>Sign in to start playing</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full" size="lg">
            Sign in with 42
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          </p>
          <Button variant="ghost" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
