import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";

export const CopyButton: React.FC<{ value?: string; className?: string }> = ({
  value,
  className,
}) => {
  const { copy, copied } = useCopyToClipboard({
    timeout: 1000,
  });

  return (
    <button
      disabled={copied}
      onClick={() => value && copy(value)}
      className={cn(
        "h-10 w-10 p-0 flex justify-center items-center",
        className
      )}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
  );
};
