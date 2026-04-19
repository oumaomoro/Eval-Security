import { useWorkspace } from "@/hooks/use-workspace";
import { ChevronDown, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2 px-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">
              {activeWorkspace?.name || "Select Workspace"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] p-2 shadow-xl border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-1.5">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className={`rounded-md px-2 py-2 cursor-pointer transition-colors ${
              activeWorkspace?.id === ws.id 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            {ws.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
