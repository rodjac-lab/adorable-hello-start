import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";

interface PublicationStatusControlsProps {
  status: ContentStatus;
  onPublish: () => void;
  onUnpublish: () => void;
  className?: string;
}

const getStatusLabel = (status: ContentStatus): string => {
  return status === "published" ? "Publié" : "Brouillon";
};

const getStatusBadgeClassName = (status: ContentStatus): string => {
  if (status === "published") {
    return "bg-emerald-500 text-emerald-950 dark:text-emerald-50 hover:bg-emerald-500";
  }

  return "bg-amber-200 text-amber-900 hover:bg-amber-200";
};

const getActionLabel = (status: ContentStatus): string => {
  return status === "published" ? "Dépublier" : "Publier";
};

export const PublicationStatusControls = ({
  status,
  onPublish,
  onUnpublish,
  className,
}: PublicationStatusControlsProps) => {
  const handleClick = () => {
    if (status === "published") {
      onUnpublish();
      return;
    }

    onPublish();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClassName(status))}>
        {getStatusLabel(status)}
      </Badge>
      <Button size="sm" variant="outline" onClick={handleClick}>
        {getActionLabel(status)}
      </Button>
    </div>
  );
};
