import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onSignIn: () => void;
}

export default function Navbar({
  theme,
  onToggleTheme,
  onOpenHelp,
  onSignIn,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-b-warm/30 bg-background">
      <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-4">
        <h1 className="text-base font-semibold tracking-tight text-earth dark:text-warm">
          Meetup Planner
        </h1>

        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" onClick={onOpenHelp}>
            Help
          </Button>
          <Button variant="ghost" onClick={onSignIn}>
            Sign in
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="size-4" />
            ) : (
              <Sun className="size-4" />
            )}
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2 p-4">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={onOpenHelp}
                >
                  Help
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={onSignIn}
                >
                  Sign in
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start gap-2"
                  onClick={onToggleTheme}
                >
                  {theme === "light" ? (
                    <Moon className="size-4" />
                  ) : (
                    <Sun className="size-4" />
                  )}
                  {theme === "light" ? "Dark mode" : "Light mode"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
