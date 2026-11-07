"use client";
// error.tsx must be a Client Component: Next.js renders it in the browser and passes retry

import { LoadError } from "@/components/features/layout";

type Props = {
  retry: () => void;
};

// Sits inside the (main) layout, so the bottom tabs stay and the other screens are one tap away
const MainError = ({ retry }: Props) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
      <LoadError onRetry={retry} />
    </div>
  );
};

export default MainError;
