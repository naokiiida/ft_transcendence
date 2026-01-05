import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PrivacyPage() {
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p className="text-muted-foreground mb-4">
            Last updated: January 2026
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">1. Information We Collect</h3>
          <p className="text-muted-foreground mb-4">
            We collect information you provide when you create an account, including your 42 profile
            information (username, email, profile picture) obtained through OAuth authentication.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">2. How We Use Your Information</h3>
          <p className="text-muted-foreground mb-4">
            Your information is used to provide the game service, maintain your profile, track game
            statistics, and enable social features like friends lists and chat.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">3. Data Storage</h3>
          <p className="text-muted-foreground mb-4">
            Your data is stored securely using industry-standard encryption. Game history and
            statistics are retained for the duration of your account.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">4. Data Sharing</h3>
          <p className="text-muted-foreground mb-4">
            We do not sell or share your personal information with third parties. Your public
            profile information (username, avatar, stats) may be visible to other players.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">5. Your Rights</h3>
          <p className="text-muted-foreground mb-4">
            You can request access to, correction of, or deletion of your personal data by
            contacting us. Account deletion will remove all associated data.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">6. Contact</h3>
          <p className="text-muted-foreground mb-4">
            For privacy-related inquiries, please contact the development team.
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
