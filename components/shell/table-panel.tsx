import { cn } from "@/lib/utils";
import { Table } from "@/components/ui/table";

export function TablePanel({
  minWidthClass = "min-w-[640px]",
  className,
  tableClassName,
  children,
}: {
  minWidthClass?: string;
  className?: string;
  tableClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("kumo-panel min-w-0", className)}>
      <Table wrapperClassName="kumo-table-scroll" className={cn(minWidthClass, tableClassName)}>
        {children}
      </Table>
    </div>
  );
}
