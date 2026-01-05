import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TermsPage() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p className="text-muted-foreground mb-4">
            Last updated: January 2026
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h3>
          <p className="text-muted-foreground mb-4">
            By accessing or using ft_transcendence, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the service.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">2. Description of Service</h3>
          <p className="text-muted-foreground mb-4">
            ft_transcendence is a real-time multiplayer Pong game that allows users to play against
            each other, participate in tournaments, and communicate via chat.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">3. User Accounts</h3>
          <p className="text-muted-foreground mb-4">
            You must authenticate using your 42 account to access the service. You are responsible
            for maintaining the security of your account and all activities under it.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">4. User Conduct</h3>
          <p className="text-muted-foreground mb-4">
            Users agree not to engage in harassment, cheating, or any behavior that disrupts the
            gaming experience for others. Violations may result in account suspension.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">5. Intellectual Property</h3>
          <p className="text-muted-foreground mb-4">
            All content, features, and functionality of ft_transcendence are owned by the
            development team and are protected by applicable intellectual property laws.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">6. Disclaimer</h3>
          <p className="text-muted-foreground mb-4">
            The service is provided "as is" without warranties of any kind. We do not guarantee
            uninterrupted or error-free operation.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">7. Changes to Terms</h3>
          <p className="text-muted-foreground mb-4">
            We reserve the right to modify these terms at any time. Continued use of the service
            after changes constitutes acceptance of the modified terms.
          </p>

          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
