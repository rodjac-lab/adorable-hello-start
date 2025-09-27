import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DraftCalloutProps {
  isStudioEditing: boolean;
  message?: string;
}

export const DraftCallout = ({
  isStudioEditing,
  message = "Le contenu sera bientôt disponible."
}: DraftCalloutProps) => (
  <Card className="max-w-2xl mx-auto text-center shadow-lg">
    <CardHeader>
      <CardTitle className="text-2xl">✍️ Contenu en cours de rédaction</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        {message}
        {isStudioEditing ? (
          <>
            {" "}
            Vous pouvez préparer le contenu depuis
            {" "}
            <Link to="/studio" className="text-primary underline font-medium">
              Studio
            </Link>
            .
          </>
        ) : (
          " Revenez prochainement pour découvrir ce contenu."
        )}
      </p>
    </CardContent>
  </Card>
);