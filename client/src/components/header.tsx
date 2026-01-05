import { useState } from "react";
import { Link, useParams } from "wouter";
import { BookOpen, HelpCircle, Plus, Wallet } from "lucide-react";
import { UserMenu } from "./user-menu";
import { WithdrawRequestDialog } from "./withdraw-request-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  companyId?: string;
  onCreateCourse?: () => void;
  showCreateButton?: boolean;
  showWithdrawButton?: boolean;
  apiBasePath?: string;
}

export function Header({ 
  companyId, 
  onCreateCourse, 
  showCreateButton = false,
  showWithdrawButton = false,
  apiBasePath 
}: HeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Fetch earnings data if companyId is provided
  const { data: dashboardData } = useQuery({
    queryKey: [apiBasePath || "/api/dashboard", companyId],
    enabled: !!companyId && showWithdrawButton,
  });

  const availableBalance = dashboardData?.earnings?.availableBalance || 0;

  const params = useParams<{ companyId: string }>();
  const headerCompanyId = companyId || params.companyId;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold">Course Builder</h1>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setShowHowItWorks(true)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground ml-1"
              data-testid="button-how-it-works"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {showWithdrawButton && availableBalance > 0 && (
              <Button 
                variant="outline"
                onClick={() => setShowWithdrawDialog(true)}
                data-testid="button-withdraw"
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Withdraw</span>
                <span className="font-semibold">${availableBalance.toFixed(2)}</span>
              </Button>
            )}
            {showCreateButton && (
              <Button onClick={onCreateCourse} data-testid="button-create-course">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            )}
            <UserMenu companyId={headerCompanyId} />
          </div>
        </div>
      </header>

      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Cursai Works</DialogTitle>
            <DialogDescription>Everything you need to know about running your courses on our platform</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                AI Course Generation
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Enter any topic and our AI instantly generates a complete course with modules, lessons, and structured content. No more spending hours on curriculum design—let AI handle it.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Customization & Control
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Customize every module and lesson. Add your own content, regenerate sections, and personalize the course before publishing. You have full control.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Free or Paid Courses
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Decide whether your course is free or paid. Set any price you want. Free courses grow your audience, paid courses generate revenue.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Member Access
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once published, your community members can discover and access your courses. Free courses are instantly available. Paid courses require purchase.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Revenue Split
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                <span className="font-semibold text-foreground">You earn 70% of every course sale</span>. Cursai keeps 30% to maintain the platform and power the AI. It's a fair partnership.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Earn Passively
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once your course is published, it sells 24/7. Watch your earnings grow as members purchase access. No ongoing effort required after publishing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Clean Learning Experience
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Members enjoy a distraction-free reading and listening experience. They can read lessons or listen with AI-powered text-to-speech powered by Murf TTS. Navigate through modules, track progress, and learn at their own pace without clutter.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-6">
              <p className="text-sm text-foreground font-semibold mb-2">Quick Start:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>1. Click "Create Course" and enter a topic</li>
                <li>2. Review the AI-generated course structure</li>
                <li>3. Customize modules and lessons as needed</li>
                <li>4. Set it as free or add a price</li>
                <li>5. Publish and start earning</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {companyId && (
        <WithdrawRequestDialog
          open={showWithdrawDialog}
          onOpenChange={setShowWithdrawDialog}
          companyId={companyId}
          availableBalance={availableBalance}
          apiBasePath={apiBasePath}
        />
      )}
    </>
  );
}
