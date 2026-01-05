import { Link } from "wouter";
import { BookOpen, HelpCircle, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  showHowItWorks?: () => void;
  availableBalance?: number;
  showWithdrawDialog?: () => void;
  onCreateCourse?: () => void;
  children?: React.ReactNode;
  showBranding?: boolean;
}

export function Header({ 
  showHowItWorks, 
  availableBalance, 
  showWithdrawDialog, 
  onCreateCourse,
  children,
  showBranding = true
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-2">
          {showBranding && (
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-semibold">Course Builder</h1>
            </Link>
          )}
          {showHowItWorks && (
            <Button 
              variant="ghost"
              size="icon"
              onClick={showHowItWorks}
              className="h-6 w-6 text-muted-foreground hover:text-foreground ml-1"
              data-testid="button-how-it-works"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          )}
          {children && (
            <div className="ml-4 flex items-center gap-3 border-l pl-4">
              {children}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {availableBalance !== undefined && availableBalance > 0 && showWithdrawDialog && (
            <Button 
              variant="outline"
              size="sm"
              onClick={showWithdrawDialog}
              data-testid="button-withdraw"
              className="gap-2 h-9"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Withdraw</span>
              <span className="font-semibold">${availableBalance.toFixed(2)}</span>
            </Button>
          )}
          {onCreateCourse && (
            <Button size="sm" onClick={onCreateCourse} data-testid="button-create-course" className="h-9">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
