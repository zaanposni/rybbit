import { Button } from "@/components/ui/button";

interface HelpSectionProps {
  router: {
    push: (url: string) => void;
  };
}

export function HelpSection({ router }: HelpSectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium mb-4">Need Help?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-2">
        For billing questions or subscription support, please contact our
        customer service team.
      </p>
      <Button variant="outline" onClick={() => router.push("/contact")}>
        Contact Support
      </Button>
    </div>
  );
}
