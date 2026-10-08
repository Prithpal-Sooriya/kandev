"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@kandev/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@kandev/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@kandev/ui/tooltip";
import { IconHexagon, IconPlugConnected, IconTicket } from "@tabler/icons-react";
import { useJiraAvailable } from "@/hooks/domains/jira/use-jira-availability";
import { useLinearAvailable } from "@/hooks/domains/linear/use-linear-availability";

type MobileIntegrationsSectionProps = {
  onNavigate: () => void;
};

// GitHub is intentionally absent from this menu: its dashboard/watch
// surfaces were removed to cut GitHub API usage, and probing GitHub status
// on every app load cost API quota. GitHub still powers task creation from
// GitHub URLs and PR auto-attach on tasks.
type IntegrationId = "jira" | "linear";

type IntegrationLink = {
  id: IntegrationId;
  label: string;
  href: string;
};

type IntegrationAvailability = {
  jiraAvailable: boolean;
  linearAvailable: boolean;
};

const INTEGRATION_LINKS: IntegrationLink[] = [
  { id: "jira", label: "Jira", href: "/jira" },
  { id: "linear", label: "Linear", href: "/linear" },
];

const INTEGRATION_ICONS = {
  jira: IconTicket,
  linear: IconHexagon,
} satisfies Record<IntegrationId, typeof IconTicket>;

const HOVER_CLOSE_DELAY_MS = 180;

export function getAvailableIntegrationLinks({
  jiraAvailable,
  linearAvailable,
}: IntegrationAvailability): IntegrationLink[] {
  return INTEGRATION_LINKS.filter((link) => {
    if (link.id === "jira") return jiraAvailable;
    return linearAvailable;
  });
}

function useConfiguredIntegrationLinks(): IntegrationLink[] {
  const jiraAvailable = useJiraAvailable();
  const linearAvailable = useLinearAvailable();

  return getAvailableIntegrationLinks({
    jiraAvailable,
    linearAvailable,
  });
}

export function IntegrationsMenu() {
  const links = useConfiguredIntegrationLinks();
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const clearCloseTimeout = () => {
    if (!closeTimeoutRef.current) return;
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const openOnHover = () => {
    clearCloseTimeout();
    setOpen((current) => (current ? current : true));
  };

  const closeAfterHover = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    clearCloseTimeout();
    setOpen(nextOpen);
  };

  if (links.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Integrations"
          onPointerEnter={openOnHover}
          onPointerLeave={closeAfterHover}
        >
          <IconPlugConnected className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        onPointerEnter={openOnHover}
        onPointerLeave={closeAfterHover}
      >
        <DropdownMenuLabel>Integrations</DropdownMenuLabel>
        {links.map((link) => {
          const Icon = INTEGRATION_ICONS[link.id];
          return (
            <DropdownMenuItem key={link.id} asChild className="cursor-pointer">
              <Link href={link.href}>
                <Icon className="h-4 w-4 text-muted-foreground" />
                {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function IntegrationsTopbarLinks() {
  const links = useConfiguredIntegrationLinks();
  if (links.length === 0) return null;

  return (
    <>
      {links.map((link) => {
        const Icon = INTEGRATION_ICONS[link.id];
        return (
          <Tooltip key={link.id}>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon-lg" className="cursor-pointer">
                <Link href={link.href} aria-label={link.label}>
                  <Icon className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{link.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

export function MobileIntegrationsSection({ onNavigate }: MobileIntegrationsSectionProps) {
  const links = useConfiguredIntegrationLinks();

  if (links.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Integrations</div>
      {links.map((link) => {
        const Icon = INTEGRATION_ICONS[link.id];
        return (
          <Button
            key={link.id}
            asChild
            variant="outline"
            className="w-full cursor-pointer justify-start gap-2"
          >
            <Link href={link.href} onClick={onNavigate}>
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{link.label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
