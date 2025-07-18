
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { AppSidebar } from "@/components/Sidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import Analytics from "@/pages/Analytics";
import Comments from "@/pages/Comments";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";
import { useAuth } from '@/context/AuthContext';
import Bookmarked from '@/pages/Bookmarked';

const queryClient = new QueryClient();

const AppLayout = () => {
  const { user } = useAuth();
  return (
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
              {user.role === 'admin' ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/bookmarked" element={<Bookmarked />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/comments" element={<Comments />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/bookmarked" element={<Bookmarked />} />
                  <Route path="*" element={<Navigate to="/documents" replace />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

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
                    <AppLayout />
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
