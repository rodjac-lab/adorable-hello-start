import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface GenericListEditorProps {
  title: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  editingCard?: ReactNode;
  children: ReactNode;
  description?: string;
}

export const GenericListEditor = ({
  title,
  count,
  addLabel,
  onAdd,
  editingCard,
  children,
  description,
}: GenericListEditorProps) => (
  <section className="space-y-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          {title}
          <span className="ml-2 text-base font-normal text-muted-foreground">({count})</span>
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Button onClick={onAdd}>{addLabel}</Button>
    </div>
    {editingCard}
    <div className="grid gap-4">{children}</div>
  </section>
);
