import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";

interface WithdrawRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  availableBalance: number;
  apiBasePath?: string;
}

export function WithdrawRequestDialog({
  open,
  onOpenChange,
  companyId,
  availableBalance,
  apiBasePath,
}: WithdrawRequestDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const endpoint = apiBasePath
        ? `${apiBasePath}/withdraw-request`
        : `/api/dashboard/${companyId}/withdraw-request`;
      return apiRequest("POST", endpoint, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Withdraw Request Sent",
        description: `Your request for $${data.amount.toFixed(2)} has been submitted. You'll receive payment manually to your Whop account.`,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    setIsSubmitting(true);
    withdrawMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Request to withdraw your available earnings. Payment will be processed manually to your Whop account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-400/10">
            <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
            <p className="text-3xl font-bold">${availableBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p>Your withdrawal request will be sent to the admin for manual processing. You'll receive payment directly to your Whop account within 2-5 business days.</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || availableBalance <= 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Request Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
