import { useRef, useState } from "react";
import { toast } from "sonner";

import DataRecovery from "@/components/DataRecovery";
import { Header } from "@/components/Header";
import { JournalDiagnostic } from "@/components/JournalDiagnostic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { MediaAsset } from "@/lib/mediaStore";
import { Copy, FolderInput, Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";

const Studio = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    assets,
    uploadMedia,
    deleteAsset,
    usage,
    usagePercent,
    isUploading,
    formatBytes,
  } = useMediaLibrary();

  const handleUpload = async (files: File[]) => {
    if (!files.length) {
      return;
    }

    await uploadMedia(files);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    await handleUpload(files);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith("image"));
    if (!dropped.length) {
      return;
    }
    await handleUpload(dropped);
  };

  const handleCopyUrl = async (asset: MediaAsset) => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(asset.url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = asset.url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("URL copiée dans le presse-papiers");
    } catch (error) {
      console.error("❌ Impossible de copier l'URL", error);
      toast.error("Impossible de copier l'URL");
    }
  };

  const hasAssets = assets.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-playfair font-semibold text-foreground">Studio de création</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gérez vos contenus hors ligne : bibliothèque de médias, diagnostic du journal et outils de secours.
            </p>
          </div>

          <Tabs defaultValue="medias" className="space-y-6">
            <TabsList className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
              <TabsTrigger value="medias">Médias</TabsTrigger>
              <TabsTrigger value="journal">Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="medias" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5 text-primary" />
                    Téléverser des images
                  </CardTitle>
                  <CardDescription>
                    Glissez-déposez vos visuels ou sélectionnez des fichiers pour les compresser et les stocker localement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center transition-colors",
                      isDragging ? "border-primary bg-primary/5" : "border-muted",
                      isUploading && "opacity-80"
                    )}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : (
                      <FolderInput className="h-10 w-10 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Déposez vos images ici</p>
                      <p className="text-xs text-muted-foreground">
                        Compression automatique (~75%) et stockage hors ligne avec suivi de quota.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Sélectionner des fichiers
                    </Button>
                    <div className="w-full space-y-2 text-left text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          {usage.assetCount} / {usage.maxAssets} média(s)
                        </span>
                        <span>
                          {formatBytes(usage.totalBytes)} / {formatBytes(usage.maxBytes)}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Médiathèque
                  </CardTitle>
                  <CardDescription>
                    Visualisez, copiez ou supprimez les médias déjà stockés. Les modifications affectent immédiatement le formulaire du journal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!hasAssets ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 opacity-40" />
                      <p>Aucun média pour l&apos;instant.</p>
                      <p className="text-sm">Ajoutez vos premières images via le panneau de téléversement.</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[480px] pr-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg"
                          >
                            <div className="aspect-square overflow-hidden bg-muted">
                              <img
                                src={asset.url}
                                alt={asset.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="space-y-1 px-4 py-3 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium" title={asset.name}>
                                  {asset.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{formatBytes(asset.size)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>
                                  {asset.width && asset.height ? `${asset.width}×${asset.height}` : ""}
                                </span>
                                {asset.lastUsedAt && (
                                  <span>Utilisé le {new Date(asset.lastUsedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 via-black/40 to-transparent px-3 py-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="flex items-center gap-2"
                                onClick={() => handleCopyUrl(asset)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copier l&apos;URL
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-2"
                                onClick={() => {
                                  if (confirm("Supprimer ce média ?")) {
                                    deleteAsset(asset.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal" className="space-y-6">
              <JournalDiagnostic />
              <DataRecovery />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Studio;
