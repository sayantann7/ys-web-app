
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AppSidebar } from "@/components/Sidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <SidebarProvider>
                      <div className="min-h-screen flex w-full bg-background">
                        <AppSidebar />
                        <div className="flex-1 flex flex-col">
                          <header className="h-14 flex items-center border-b border-border bg-white px-4">
                            <SidebarTrigger />
                            <div className="ml-4">
                              <h1 className="font-semibold text-foreground">Document Repository Admin</h1>
                            </div>
                          </header>
                          <main className="flex-1 overflow-auto">
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/users" element={<Users />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </SidebarProvider>
                  </AuthGuard>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
