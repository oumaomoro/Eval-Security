import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full flex items-center justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl px-3"
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {i18n.language === "en" ? "English (US)" : "Kiswahili (KE)"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-slate-900 border-white/10 text-slate-300">
        <DropdownMenuItem 
          onClick={() => changeLanguage("en")}
          className="hover:bg-primary/20 hover:text-primary cursor-pointer text-xs"
        >
          🇺🇸 English (US)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("sw")}
          className="hover:bg-primary/20 hover:text-primary cursor-pointer text-xs"
        >
          🇰🇪 Kiswahili (East Africa)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
