import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Function to parse French date format like "15 mars 2024"
const parseFrenchDate = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;
  
  try {
    // If it's already a valid date string, parse it directly
    const directParse = new Date(dateString);
    if (!isNaN(directParse.getTime())) {
      return directParse;
    }
    
    // Parse French format "15 mars 2024"
    const frenchMonths: { [key: string]: number } = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };
    
    const parts = dateString.trim().split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      
      const monthIndex = frenchMonths[monthName];
      if (monthIndex !== undefined && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIndex, day);
      }
    }
    
    console.warn('Failed to parse French date:', dateString);
    return undefined;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return undefined;
  }
};
import { CalendarIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the schema for form validation
const journalEntrySchema = z.object({
  day: z.number().min(1, "Le jour doit être au moins 1"),
  date: z.date({
    required_error: "La date est requise",
  }),
  title: z.string().min(1, "Le titre est requis").max(100, "Le titre ne peut pas dépasser 100 caractères"),
  location: z.string().min(1, "Le lieu est requis").max(100, "Le lieu ne peut pas dépasser 100 caractères"),
  story: z.string().min(10, "L'histoire doit contenir au moins 10 caractères").max(2000, "L'histoire ne peut pas dépasser 2000 caractères"),
  mood: z.string().min(1, "L'humeur est requise"),
  link: z.string().url("Lien invalide").optional().or(z.literal("")),
  photos: z.array(z.string()).optional(),
});

type JournalEntryFormData = z.infer<typeof journalEntrySchema>;

interface AddJournalEntryFormProps {
  onSubmit: (entry: JournalEntryFormData) => void;
  onCancel: () => void;
  editEntry?: {
    day: number;
    date: string;
    title: string;
    location: string;
    story: string;
    mood: string;
    photos?: string[];
    link?: string;
  };
}

const MOOD_OPTIONS = [
  "Enthousiaste",
  "Heureux",
  "Satisfait",
  "Mitigé",
  "Déçu",
  "Fatigué",
  "Inspiré",
  "Nostalgique",
  "Émerveillé"
];

export const AddJournalEntryForm: React.FC<AddJournalEntryFormProps> = ({
  onSubmit,
  onCancel,
  editEntry,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(editEntry?.photos || []);

  const form = useForm<JournalEntryFormData>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      day: editEntry?.day || 1,
      date: editEntry?.date ? parseFrenchDate(editEntry.date) : undefined,
      title: editEntry?.title || "",
      location: editEntry?.location || "",
      story: editEntry?.story || "",
      mood: editEntry?.mood || "",
      link: editEntry?.link || "",
      photos: editEntry?.photos || [],
    },
  });

  const watchedValues = form.watch();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: string[] = [];
    
    for (const file of Array.from(files)) {
      try {
        // Create FormData to upload file
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload to lovable-uploads directory
        const response = await fetch('/api/upload', {
          method: 'POST', 
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          newFiles.push(result.path || `/lovable-uploads/${file.name}`);
        } else {
          // Fallback to local file URL for preview
          const fileUrl = URL.createObjectURL(file);
          newFiles.push(fileUrl);
        }
      } catch (error) {
        // Fallback to local file URL for preview
        const fileUrl = URL.createObjectURL(file);
        newFiles.push(fileUrl);
      }
    }

    setUploadedFiles([...uploadedFiles, ...newFiles]);
    form.setValue("photos", [...(form.getValues("photos") || []), ...newFiles]);
    
    toast.success(`${newFiles.length} photo(s) ajoutée(s)`);
  };

  const removePhoto = (photoToRemove: string) => {
    const updatedFiles = uploadedFiles.filter(file => file !== photoToRemove);
    const updatedPhotos = (form.getValues("photos") || []).filter(photo => photo !== photoToRemove);
    
    setUploadedFiles(updatedFiles);
    form.setValue("photos", updatedPhotos);
  };

  const handleSubmit = (data: JournalEntryFormData) => {
    onSubmit(data);
    toast.success(editEntry ? "Entrée modifiée avec succès !" : "Entrée de journal ajoutée !");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Form Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {editEntry ? "Modifier l'entrée de journal" : "Nouvelle entrée de journal"}
          </CardTitle>
          <CardDescription>
            {editEntry ? "Modifiez votre expérience de voyage" : "Partagez votre expérience de voyage"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Day and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day">Jour du voyage</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  {...form.register("day", { valueAsNumber: true })}
                  className="w-full"
                />
                {form.formState.errors.day && (
                  <p className="text-sm text-destructive">{form.formState.errors.day.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedValues.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedValues.date ? (
                        format(watchedValues.date, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedValues.date}
                      onSelect={(date) => form.setValue("date", date!)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>
            </div>

            {/* Title and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Ex: Découverte de Petra"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="Ex: Petra, Jordanie"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Mood Selection */}
            <div className="space-y-2">
              <Label>Humeur du jour</Label>
              <Select onValueChange={(value) => form.setValue("mood", value)} value={watchedValues.mood}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir votre humeur" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((mood) => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.mood && (
                <p className="text-sm text-destructive">{form.formState.errors.mood.message}</p>
              )}
            </div>

            {/* Story */}
            <div className="space-y-2">
              <Label htmlFor="story">Votre histoire</Label>
              <Textarea
                id="story"
                {...form.register("story")}
                placeholder="Racontez votre journée, vos découvertes, vos émotions..."
                className="min-h-[200px] resize-y"
              />
              <div className="text-sm text-muted-foreground">
                {watchedValues.story?.length || 0} / 2000 caractères
              </div>
              {form.formState.errors.story && (
                <p className="text-sm text-destructive">{form.formState.errors.story.message}</p>
              )}
            </div>

            {/* Optional Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Lien (optionnel)</Label>
              <Input
                id="link"
                type="url"
                {...form.register("link")}
                placeholder="Ex: https://maps.google.com/..."
              />
              {form.formState.errors.link && (
                <p className="text-sm text-destructive">{form.formState.errors.link.message}</p>
              )}
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photos (optionnel)</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour ajouter des photos
                  </span>
                </label>
              </div>

              {/* Uploaded Photos */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Photos ajoutées :</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={`${file}-${index}`}
                        className="relative group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={file} 
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(file)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                {showPreview ? "Masquer" : "Aperçu"}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {editEntry ? "Sauvegarder les modifications" : "Ajouter l'entrée"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && watchedValues.title && watchedValues.story && (
        <Card className="shadow-elegant bg-gradient-to-br from-card via-card/95 to-card/90">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-serif text-3xl mb-3 text-foreground tracking-wide">
                  Jour {watchedValues.day} — {watchedValues.title}
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground font-light">
                  {watchedValues.date 
                    ? format(watchedValues.date, "d MMMM yyyy", { locale: fr })
                    : "Date non définie"
                  } • {watchedValues.location}
                </CardDescription>
              </div>
              {watchedValues.mood && (
                <Badge variant="secondary" className="ml-4 px-3 py-1 font-light tracking-wide">
                  {watchedValues.mood}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line font-light text-base tracking-wide">
                {watchedValues.story}
              </p>
            </div>
            
            {/* Photos in preview */}
            {watchedValues.photos && watchedValues.photos.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-lg">📸 Photos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchedValues.photos.map((photo, index) => (
                    <div key={`preview-${photo}-${index}`} className="rounded-lg overflow-hidden shadow-md">
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {watchedValues.link && (
              <div className="mt-4">
                <a 
                  href={watchedValues.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-premium-accent hover:text-premium-foreground transition-colors duration-200 text-sm font-light"
                >
                  🔗 Voir le lien
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};