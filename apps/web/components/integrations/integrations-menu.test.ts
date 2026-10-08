import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAvailableIntegrationLinks,
  IntegrationsMenu,
  IntegrationsTopbarLinks,
} from "./integrations-menu";
import { TooltipProvider } from "@kandev/ui/tooltip";

const useJiraAvailableMock = vi.hoisted(() => vi.fn());
const useLinearAvailableMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/domains/jira/use-jira-availability", () => ({
  useJiraAvailable: useJiraAvailableMock,
}));

vi.mock("@/hooks/domains/linear/use-linear-availability", () => ({
  useLinearAvailable: useLinearAvailableMock,
}));

function mockAvailability({
  jiraAvailable,
  linearAvailable,
}: {
  jiraAvailable: boolean;
  linearAvailable: boolean;
}) {
  useJiraAvailableMock.mockReturnValue(jiraAvailable);
  useLinearAvailableMock.mockReturnValue(linearAvailable);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("getAvailableIntegrationLinks", () => {
  it("returns only configured integration destinations", () => {
    expect(
      getAvailableIntegrationLinks({
        jiraAvailable: false,
        linearAvailable: true,
      }),
    ).toEqual([{ id: "linear", label: "Linear", href: "/linear" }]);
  });

  it("returns no setup destinations when integrations are unavailable", () => {
    expect(
      getAvailableIntegrationLinks({
        jiraAvailable: false,
        linearAvailable: false,
      }),
    ).toEqual([]);
  });
});

describe("IntegrationsMenu", () => {
  it("opens configured integration links on hover", async () => {
    mockAvailability({ jiraAvailable: true, linearAvailable: false });

    render(createElement(IntegrationsMenu, {}));

    const trigger = screen.getByRole("button", { name: "Integrations" });
    expect(screen.queryByText("Jira")).toBeNull();

    fireEvent.pointerEnter(trigger);

    expect(await screen.findByText("Jira")).toBeTruthy();
    expect(screen.queryByText("Linear")).toBeNull();
  });

  it("does not render when no integrations are configured", () => {
    mockAvailability({ jiraAvailable: false, linearAvailable: false });

    render(createElement(IntegrationsMenu, {}));

    expect(screen.queryByRole("button", { name: "Integrations" })).toBeNull();
  });
});

function renderWithTooltip(component: Parameters<typeof render>[0]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TooltipProvider requires children in its type but createElement passes them as 3rd arg
  return render(createElement(TooltipProvider, {} as any, component));
}

describe("IntegrationsTopbarLinks", () => {
  it("renders an icon link for each configured integration", () => {
    mockAvailability({ jiraAvailable: false, linearAvailable: true });

    renderWithTooltip(createElement(IntegrationsTopbarLinks, {}));

    const linearLink = screen.getByRole("link", { name: "Linear" });
    expect(linearLink.getAttribute("href")).toBe("/linear");
    expect(screen.queryByRole("link", { name: "Jira" })).toBeNull();
  });

  it("renders nothing when no integrations are configured", () => {
    mockAvailability({ jiraAvailable: false, linearAvailable: false });

    const { container } = renderWithTooltip(createElement(IntegrationsTopbarLinks, {}));
    expect(container.firstChild).toBeNull();
  });
});
