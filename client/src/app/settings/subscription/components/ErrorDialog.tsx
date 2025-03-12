import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ErrorDialogProps {
  showConfigError: boolean;
  setShowConfigError: (show: boolean) => void;
  errorType: "cancel" | "resume";
  router: {
    push: (url: string) => void;
  };
}

export function ErrorDialog({
  showConfigError,
  setShowConfigError,
  errorType,
  router,
}: ErrorDialogProps) {
  return (
    <Dialog open={showConfigError} onOpenChange={setShowConfigError}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {errorType === "cancel"
              ? "Subscription Cancellation Unavailable"
              : "Stripe Checkout Error"}
          </DialogTitle>
          <DialogDescription className="py-4">
            {errorType === "cancel"
              ? "Our subscription management system is currently being configured. You cannot cancel your subscription at this time."
              : "We encountered an issue while trying to redirect you to the Stripe checkout page. Please try again or view all plans to select a new subscription."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between">
          <Button onClick={() => setShowConfigError(false)}>Close</Button>
          {errorType === "resume" ? (
            <Button
              variant="default"
              onClick={() => {
                router.push("/subscribe");
                setShowConfigError(false);
              }}
            >
              View Plans
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                router.push("/contact");
                setShowConfigError(false);
              }}
            >
              Contact Support
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
