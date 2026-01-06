import { BookOpen, HelpCircle, Wallet, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { UserMenu } from "./user-menu";

interface AdminHeaderProps {
  availableBalance: number;
  onCreateCourse: () => void;
  onShowHowItWorks: () => void;
  onWithdraw: () => void;
  showWithdrawButton?: boolean;
}

export function AdminHeader({
  availableBalance,
  onCreateCourse,
  onShowHowItWorks,
  onWithdraw,
  showWithdrawButton = true,
}: AdminHeaderProps) {
  return (
    <header className="border-b bg-background shrink-0">
      <div className="h-14 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="font-semibold">Course Builder</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowHowItWorks}
            className="h-6 w-6 text-muted-foreground hover:text-foreground ml-1"
            data-testid="button-how-it-works"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {showWithdrawButton && (
            <Button
              variant="outline"
              onClick={onWithdraw}
              data-testid="button-withdraw"
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Withdraw</span>
              {availableBalance > 0 && (
                <span className="font-semibold">${availableBalance.toFixed(2)}</span>
              )}
            </Button>
          )}
          <Button onClick={onCreateCourse} data-testid="button-create-course">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
