import { useState } from "react";

export const useCopyToClipboard = ({ timeout }: { timeout: number }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, timeout);
  };

  return { copyToClipboard, copied };
};