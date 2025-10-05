import { useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddJournalEntryFormProps, JournalEntryForm, JournalEntryPreview, useJournalEntryForm } from "@/components/AddJournalEntryForm";
import { JournalEntry } from "@/lib/journalStorage";
import { toast } from "sonner";
import type { JournalEntryFormData } from "@/types/journal";
import type { ContentStatus } from "@/types/content";
import { PublicationStatusControls } from "@/features/editor/components/PublicationStatusControls";

interface EntryFormPanelProps {
  mode: "create" | "edit";
  entry?: JournalEntry | null;
  onSubmit: (values: JournalEntryFormData) => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
  onSuccess?: (result: JournalEntryFormData) => void;
  status?: ContentStatus;
  onStatusChange?: (status: ContentStatus) => void;
}

const toEditEntry = (entry?: JournalEntry | null): AddJournalEntryFormProps["editEntry"] | undefined => {
  if (!entry) {
    return undefined;
  }

  return {
    day: entry.day,
    date: entry.date,
    title: entry.title,
    location: entry.location,
    story: entry.story,
    mood: entry.mood,
    photos: entry.photos,
    link: entry.link,
  };
};

export const EntryFormPanel = ({
  mode,
  entry,
  onSubmit,
  onCancel,
  onSuccess,
  status,
  onStatusChange,
}: EntryFormPanelProps) => {
  const editableEntry = useMemo(() => toEditEntry(mode === "edit" ? entry : undefined), [entry, mode]);

  const {
    form,
    watchedValues,
    showPreview,
    togglePreview,
    uploadedFiles,
    handleFileUpload,
    removePhoto,
    resetForm,
  } = useJournalEntryForm({ editEntry: editableEntry });

  useEffect(() => {
    resetForm(editableEntry);
  }, [editableEntry, resetForm]);

  const handleSubmit = async (data: JournalEntryFormData) => {
    const result = await onSubmit(data);
    if (result !== false) {
      toast.success(mode === "edit" ? "Entrée mise à jour" : "Entrée ajoutée");
      if (mode === "create") {
        resetForm(undefined);
      } else {
        resetForm(editableEntry);
      }
      onSuccess?.(data);
    }
  };

  const handleCancel = () => {
    resetForm(editableEntry);
    onCancel?.();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-2xl">
              {mode === "edit" && entry ? `Modifier l'entrée — Jour ${entry.day}` : "Nouvelle entrée"}
            </CardTitle>
            <CardDescription>
              {mode === "edit"
                ? "Mettez à jour votre récit directement depuis le studio"
                : "Préparez une nouvelle journée de voyage"}
            </CardDescription>
          </div>
          {entry && status && onStatusChange && (
            <PublicationStatusControls
              status={status}
              onPublish={() => onStatusChange("published")}
              onUnpublish={() => onStatusChange("draft")}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <JournalEntryForm
          form={form}
          watchedValues={watchedValues}
          showPreview={showPreview}
          onTogglePreview={togglePreview}
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          onFileUpload={handleFileUpload}
          onRemovePhoto={removePhoto}
          uploadedFiles={uploadedFiles}
          editMode={mode === "edit"}
        />

        <JournalEntryPreview
          visible={showPreview}
          values={watchedValues}
          className="shadow-sm"
        />
      </CardContent>
    </Card>
  );
};
