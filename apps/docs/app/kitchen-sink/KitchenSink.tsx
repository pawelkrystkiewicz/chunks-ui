"use client";

import { Breadcrumb, Card, Separator, Tabs, Toast } from "chunks-ui";
import { Home } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { FaqSection } from "./FaqSection";
import { QuickActions } from "./QuickActions";
import { SettingsDrawer } from "./SettingsDrawer";
import { StatsCards } from "./StatsCards";
import { TaskTable } from "./TaskTable";
import { TeamPanel } from "./TeamPanel";

export function KitchenSink() {
  return (
    <Toast.Provider>
      <div className="mx-auto w-full max-w-6xl space-y-6 py-8">
        {/* Breadcrumb */}
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="/">
                <Home className="size-3.5" />
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Link href="/">Projects</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Acme Dashboard</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Acme Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Sprint 14 &middot; Mar 3 &ndash; Mar 17, 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateTaskDialog />
            <SettingsDrawer />
          </div>
        </div>

        {/* Stats */}
        <StatsCards />

        <Separator />

        {/* Main content area with Tabs */}
        <Tabs.Root defaultValue="tasks">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs.List>
              <Tabs.Tab value="tasks">Tasks</Tabs.Tab>
              <Tabs.Tab value="team">Team</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="faq">FAQ</Tabs.Tab>
              <Tabs.Indicator />
            </Tabs.List>
            <QuickActions />
          </div>

          <Tabs.Contents>
            <Tabs.Content value="tasks">
              <div className="pt-4">
                <TaskTable />
              </div>
            </Tabs.Content>

            <Tabs.Content value="team">
              <div className="pt-4">
                <TeamPanel />
              </div>
            </Tabs.Content>

            <Tabs.Content value="activity">
              <div className="pt-4">
                <Card.Root>
                  <Card.Header>
                    <Card.Title>Recent Activity</Card.Title>
                    <Card.Description>
                      What&apos;s been happening across the project.
                    </Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <ActivityFeed />
                  </Card.Content>
                </Card.Root>
              </div>
            </Tabs.Content>

            <Tabs.Content value="faq">
              <div className="pt-4">
                <Card.Root>
                  <Card.Header>
                    <Card.Title>Frequently Asked Questions</Card.Title>
                    <Card.Description>
                      Common questions about using the project dashboard.
                    </Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <FaqSection />
                  </Card.Content>
                </Card.Root>
              </div>
            </Tabs.Content>
          </Tabs.Contents>
        </Tabs.Root>
      </div>
      <Toast.Viewport />
    </Toast.Provider>
  );
}
