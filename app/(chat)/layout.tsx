import { cookies } from "next/headers";
import Script from "next/script";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { MCPProvider } from "@/components/mcp-provider";
import { MinimizedChatTab } from "@/components/minimized-chat-tab";
import { SidePanelChat } from "@/components/side-panel-chat";
import { SidePanelProvider } from "@/components/side-panel-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidePanelProvider>
        <MCPProvider>
          <DataStreamProvider>
            <Suspense fallback={<div className="flex h-dvh" />}>
              <SidebarWrapper>{children}</SidebarWrapper>
            </Suspense>
          </DataStreamProvider>
        </MCPProvider>
      </SidePanelProvider>
    </>
  );
}

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <div className="flex h-full w-full">
          <div className="min-w-0 flex-1">{children}</div>
          <SidePanelChat />
        </div>
        <MinimizedChatTab />
      </SidebarInset>
    </SidebarProvider>
  );
}
