import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  HelpCircle,
  Plus,
  Wallet,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/user-menu";
import { WithdrawRequestDialog } from "@/components/withdraw-request-dialog";

interface CourseBuilderHeaderProps {
  companyId: string;
  availableBalance?: number;
  backHref?: string;
  breadcrumb?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function CourseBuilderHeader({
  companyId,
  availableBalance = 0,
  backHref,
  breadcrumb,
  rightSlot,
}: CourseBuilderHeaderProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const availableBalanceNumber = Number(availableBalance) || 0;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {backHref ? (
              <>
                <Button variant="ghost" size="icon" asChild data-testid="button-back">
                  <Link href={backHref}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            ) : null}

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-semibold shrink-0">Course Builder</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHowItWorks(true)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                data-testid="button-how-it-works"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              {breadcrumb ? (
                <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0 truncate">{breadcrumb}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {rightSlot}
            <UserMenu />
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(true)}
              data-testid="button-withdraw"
              className="gap-2"
              disabled={availableBalanceNumber <= 0}
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Withdraw</span>
              <span className="font-semibold">${availableBalanceNumber.toFixed(2)}</span>
            </Button>
            <Button asChild data-testid="button-create-course">
              <Link href={`/dashboard/${companyId}?tab=create`}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Cursai Works</DialogTitle>
            <DialogDescription>
              Everything you need to know about running your courses on our platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                AI Course Generation
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Enter any topic and our AI instantly generates a complete course with modules,
                lessons, and structured content. No more spending hours on curriculum design—let
                AI handle it.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Customization &amp; Control
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Customize every module and lesson. Add your own content, regenerate sections, and
                personalize the course before publishing. You have full control.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Free or Paid Courses
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Decide whether your course is free or paid. Set any price you want. Free courses
                grow your audience, paid courses generate revenue.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Member Access
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once published, your community members can discover and access your courses. Free
                courses are instantly available. Paid courses require purchase.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Revenue Split
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                <span className="font-semibold text-foreground">You earn 70% of every course sale</span>. Cursai keeps 30%
                to maintain the platform and power the AI. It&apos;s a fair partnership.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Earn Passively
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Once your course is published, it sells 24/7. Watch your earnings grow as members
                purchase access. No ongoing effort required after publishing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Clean Learning Experience
              </h3>
              <p className="text-sm text-muted-foreground ml-7">
                Members enjoy a distraction-free reading and listening experience. They can read
                lessons or listen with AI-powered text-to-speech powered by Murf TTS. Navigate
                through modules, track progress, and learn at their own pace without clutter.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-6">
              <p className="text-sm text-foreground font-semibold mb-2">Quick Start:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>1. Click &quot;Create Course&quot; and enter a topic</li>
                <li>2. Review the AI-generated course structure</li>
                <li>3. Customize modules and lessons as needed</li>
                <li>4. Set it as free or add a price</li>
                <li>5. Publish and start earning</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WithdrawRequestDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        companyId={companyId}
        availableBalance={availableBalanceNumber}
      />
    </>
  );
}
