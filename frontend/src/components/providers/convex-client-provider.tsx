"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function UsernameGate() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !user.name && pathname !== "/username") {
      router.push("/username");
    }
  }, [isAuthenticated, user, pathname, router]);

  return null;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <UsernameGate />
      {children}
    </ConvexAuthNextjsProvider>
  );
}
