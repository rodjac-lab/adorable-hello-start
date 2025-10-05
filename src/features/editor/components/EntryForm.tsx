import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface EntryFormProps {
  title: string;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaveDisabled?: boolean;
  children: ReactNode;
  errors?: string[];
}

export const EntryForm = ({
  title,
  onSave,
  onCancel,
  saveLabel = "💾 Sauvegarder",
  cancelLabel = "❌ Annuler",
  isSaveDisabled,
  children,
  errors,
}: EntryFormProps) => (
  <Card className="border-2 border-primary">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {errors && errors.length > 0 && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <ul className="list-inside list-disc space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {children}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isSaveDisabled}>
          {saveLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </CardContent>
  </Card>
);
