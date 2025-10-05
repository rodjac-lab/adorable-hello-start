import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  formatBytes,
  isDefaultMediaAsset,
  type MediaAsset,
  type MediaAssetUpdate,
} from "@/lib/mediaStore";
import {
  parseTagsInput,
  useMediaLibrary,
  type ImportMediaResult,
} from "@/hooks/useMediaLibrary";
import { Loader2, Plus, RefreshCcw, Trash2, Wand2 } from "lucide-react";
import { getJournalEntries } from "@/data/journalEntries";
import { logger } from "@/lib/logger";

interface MediaAssetDraft {
  name: string;
  type: string;
  url: string;
  description: string;
  tags: string;
}

const getSourceLabel = (asset: MediaAsset): string => {
  switch (asset.source) {
    case "generated":
      return "Suggestion";
    case "external":
      return "Externe";
    default:
      return "Import";
  }
};

const formatDateTime = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const tagsToString = (tags?: string[]): string => {
  if (!tags || tags.length === 0) {
    return "";
  }

  return tags.join(", ");
};

interface MediaUsageDiagnostics {
  totalReferences: number;
  referenced: Array<{
    asset: MediaAsset;
    count: number;
    entries: { day: number; title: string }[];
  }>;
  unused: MediaAsset[];
}

const buildMediaUsageDiagnostics = (assets: MediaAsset[]): MediaUsageDiagnostics => {
  try {
    const entries = getJournalEntries({ status: "all" });
    const usage = new Map<string, { count: number; entries: { day: number; title: string }[] }>();

    entries.forEach((entry) => {
      (entry.mediaAssetIds ?? []).forEach((assetId) => {
        const current = usage.get(assetId) ?? { count: 0, entries: [] };
        current.count += 1;
        current.entries.push({ day: entry.day, title: entry.title });
        usage.set(assetId, current);
      });
    });

    const referenced = assets
      .filter((asset) => usage.has(asset.id))
      .map((asset) => {
        const metadata = usage.get(asset.id)!;
        return {
          asset,
          count: metadata.count,
          entries: metadata.entries.sort((a, b) => a.day - b.day),
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.asset.name.localeCompare(b.asset.name);
      });

    const unused = assets.filter((asset) => !usage.has(asset.id));
    const totalReferences = referenced.reduce((acc, item) => acc + item.count, 0);

    return {
      totalReferences,
      referenced,
      unused,
    };
  } catch (error) {
    logger.warn("⚠️ Impossible de calculer l'utilisation de la médiathèque", error);
    return {
      totalReferences: 0,
      referenced: [],
      unused: assets,
    };
  }
};

export const MediaManager = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    state,
    assets,
    isProcessing,
    error,
    importFiles,
    updateAsset,
    deleteAsset,
    refreshAsset,
    markAssetAsUsed,
    clearError,
  } = useMediaLibrary();

  const [usageDiagnostics, setUsageDiagnostics] = useState<MediaUsageDiagnostics>(() => buildMediaUsageDiagnostics(assets));

  const refreshUsageDiagnostics = useCallback(() => {
    setUsageDiagnostics(buildMediaUsageDiagnostics(assets));
  }, [assets]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MediaAssetDraft | null>(null);

  useEffect(() => {
    if (assets.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !assets.some((asset) => asset.id === selectedId)) {
      setSelectedId(assets[0].id);
    }
  }, [assets, selectedId]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? null,
    [assets, selectedId],
  );

  useEffect(() => {
    if (!selectedAsset) {
      setDraft(null);
      return;
    }

    setDraft({
      name: selectedAsset.name,
      type: selectedAsset.type,
      url: selectedAsset.url,
      description: selectedAsset.description ?? "",
      tags: tagsToString(selectedAsset.tags),
    });
  }, [selectedAsset]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error);
  }, [error]);

  useEffect(() => {
    refreshUsageDiagnostics();
  }, [refreshUsageDiagnostics]);

  const handleImportResult = (result: ImportMediaResult) => {
    if (result.imported > 0) {
      toast.success(
        `${result.imported} média${result.imported > 1 ? "s" : ""} ajouté${
          result.imported > 1 ? "s" : ""
        } avec succès`,
      );
    }

    if (result.skipped > 0) {
      toast.warning(
        `${result.skipped} fichier${result.skipped > 1 ? "s" : ""} n'ont pas pu être importés. Vérifiez leur format.`,
      );
    }

    if (result.quotaExceeded) {
      toast.error("Quota localStorage atteint. Supprimez des médias avant de réessayer.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }

    try {
      const result = await importFiles(files);
      handleImportResult(result);
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  const persistField = async <Key extends keyof MediaAssetDraft>(
    field: Key,
    value: MediaAssetDraft[Key],
  ) => {
    if (!selectedAsset || !draft) {
      return;
    }

    const update: MediaAssetDraft = { ...draft, [field]: value };
    setDraft(update);

    const patch: MediaAssetUpdate = {};

    if (field === "tags") {
      const nextTags = parseTagsInput(update.tags);
      const currentTags = selectedAsset.tags ?? [];
      if (nextTags.join("|") === currentTags.join("|")) {
        return;
      }
      patch.tags = nextTags;
    } else if (field === "description") {
      if ((selectedAsset.description ?? "") === update.description) {
        return;
      }
      patch.description = update.description;
    } else if (field === "name") {
      if (selectedAsset.name === update.name) {
        return;
      }
      patch.name = update.name;
    } else if (field === "type") {
      if (selectedAsset.type === update.type) {
        return;
      }
      patch.type = update.type;
    } else if (field === "url") {
      if (selectedAsset.url === update.url) {
        return;
      }
      patch.url = update.url;
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    try {
      await updateAsset(selectedAsset.id, patch);
      toast.success("Média mis à jour");
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      toast.error(message);
      setDraft({
        name: selectedAsset.name,
        type: selectedAsset.type,
        url: selectedAsset.url,
        description: selectedAsset.description ?? "",
        tags: tagsToString(selectedAsset.tags),
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) {
      return;
    }

    try {
      await deleteAsset(selectedAsset.id);
      toast.success("Média supprimé");
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    if (!selectedAsset) {
      return;
    }

    try {
      await refreshAsset(selectedAsset.id);
      toast.success("Aperçu recompressé");
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      toast.error(message);
    }
  };

  const handleMarkUsed = async () => {
    if (!selectedAsset) {
      return;
    }

    try {
      await markAssetAsUsed(selectedAsset.id);
      toast.success("Utilisation actualisée");
    } catch (value) {
      const message = value instanceof Error ? value.message : String(value);
      toast.error(message);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Médiathèque</CardTitle>
        <CardDescription>
          Centralisez vos visuels et sons prêts pour la publication, surveillez les quotas et enrichissez vos contenus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="flex items-center justify-between gap-4">
            <AlertDescription>{error}</AlertDescription>
            <Button size="sm" variant="outline" onClick={clearError}>
              Compris
            </Button>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleImportClick} className="flex items-center gap-2" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Importer des fichiers
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{state.usage.assetCount}</span> / {state.usage.maxAssets} médias • {" "}
            <span className="font-medium">{formatBytes(state.usage.totalBytes)}</span> / {formatBytes(state.usage.maxBytes)}
          </div>
        </div>

        <div className="rounded-md border border-dashed bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <span className="font-semibold">{usageDiagnostics.totalReferences}</span> référence{usageDiagnostics.totalReferences > 1 ? "s" : ""} dans le contenu
            </span>
            <span className="text-muted-foreground">
              {usageDiagnostics.unused.length} média{usageDiagnostics.unused.length > 1 ? "s" : ""} non utilisé{usageDiagnostics.unused.length > 1 ? "s" : ""}
            </span>
          </div>
          {usageDiagnostics.referenced.length > 0 ? (
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {usageDiagnostics.referenced.slice(0, 3).map(({ asset, count, entries }) => (
                <li key={asset.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-foreground">{asset.name}</span>
                  <span>
                    {count} entrée{count > 1 ? "s" : ""} — {entries.map((entry) => `Jour ${entry.day}`).join(", ")}
                  </span>
                </li>
              ))}
              {usageDiagnostics.referenced.length > 3 && (
                <li>… et {usageDiagnostics.referenced.length - 3} autre{usageDiagnostics.referenced.length - 3 > 1 ? "s" : ""}</li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Aucun média n'est encore relié aux entrées. Associez vos photos depuis l'éditeur pour les voir apparaître ici.
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <ScrollArea className="h-[420px] rounded-md border">
            <div className="divide-y">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors",
                    selectedId === asset.id ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1">{asset.name}</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(asset.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{asset.type.split("/")[0]}</Badge>
                      <Badge variant={asset.source === "generated" ? "secondary" : "outline"}>
                        {getSourceLabel(asset)}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {selectedAsset && draft ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAsset.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedAsset.type}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{formatBytes(selectedAsset.size)}</span>
                    {selectedAsset.width && selectedAsset.height && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <span>
                          {selectedAsset.width}×{selectedAsset.height}px
                        </span>
                      </>
                    )}
                    {selectedAsset.lastUsedAt && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Utilisé {formatDateTime(selectedAsset.lastUsedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRefresh}
                    disabled={isProcessing || !selectedAsset.type.startsWith("image/")}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Recompresser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleMarkUsed}
                    disabled={isProcessing}
                  >
                    <Wand2 className="h-4 w-4" />
                    Marquer utilisé
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleDelete}
                    disabled={isProcessing || isDefaultMediaAsset(selectedAsset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>

              {selectedAsset.type.startsWith("image/") ? (
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.name}
                    className="h-64 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : selectedAsset.type.startsWith("audio/") ? (
                <audio controls className="w-full" src={selectedAsset.url} />
              ) : selectedAsset.type.startsWith("video/") ? (
                <video controls className="w-full rounded-lg border" src={selectedAsset.url} />
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    onBlur={(event) => void persistField("name", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type MIME</Label>
                  <Input
                    value={draft.type}
                    onChange={(event) => setDraft({ ...draft, type: event.target.value })}
                    onBlur={(event) => void persistField("type", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={draft.url}
                  onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                  onBlur={(event) => void persistField("url", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Conservez la data URL générée lors de l'import ou remplacez-la par une ressource hébergée.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  onBlur={(event) => void persistField("description", event.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Mots-clés</Label>
                <Input
                  value={draft.tags}
                  onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                  onBlur={(event) => void persistField("tags", event.target.value)}
                  placeholder="Séparez les tags par des virgules"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
              Sélectionnez un média pour en afficher le détail ou importez un nouveau fichier.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

