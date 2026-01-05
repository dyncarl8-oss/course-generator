import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

function getCompanyIdFromSearch(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);

  return (
    params.get("companyId") ||
    params.get("experienceId") ||
    params.get("resourceId") ||
    null
  );
}

function CreatorRedirectPage({ destination }: { destination: "dashboard" | "analytics" }) {
  const [, navigate] = useLocation();
  const { user, isLoading, isAuthenticated, login } = useAuth();

  const companyId = useMemo(() => {
    return getCompanyIdFromSearch() || user?.whopCompanyId || null;
  }, [user?.whopCompanyId]);

  useEffect(() => {
    if (isLoading) return;

    if (companyId) {
      const nextPath =
        destination === "analytics"
          ? `/dashboard/${companyId}/analytics`
          : `/dashboard/${companyId}${typeof window !== "undefined" ? window.location.search : ""}`;
      navigate(nextPath, { replace: true });
    }
  }, [companyId, destination, isLoading, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Open from Whop</CardTitle>
          <CardDescription>
            We couldn&apos;t determine which dashboard to load. Please open this app from your Whop
            experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {!isAuthenticated ? <Button onClick={login}>Login with Whop</Button> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function CreatorDashboardRedirectPage() {
  return <CreatorRedirectPage destination="dashboard" />;
}

export function CreatorAnalyticsRedirectPage() {
  return <CreatorRedirectPage destination="analytics" />;
}
