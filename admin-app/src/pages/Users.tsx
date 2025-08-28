import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ImportResults } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import UserList from '@/components/users/UserList';

const Users: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<'all'|'active'|'inactive'>('all');
  const [cursor, setCursor] = useState<string|null>(null);
  const [nextCursor, setNextCursor] = useState<string|null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportBytes, setExportBytes] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pageSize = 20;

  // Debounce commit search
  useEffect(()=>{ const t = setTimeout(()=> setSearchQuery(searchInput.trim()), 600); return ()=>clearTimeout(t); }, [searchInput]);

  const fetchUsers = useCallback(async (opts?: { reset?: boolean; cursor?: string|null }) => {
    try {
      setLoadingUsers(true);
      const res = await apiService.getUsersMetrics({ cursor: opts?.cursor||null, limit: pageSize, search: searchQuery||undefined, activity });
      setUsers(res.users);
      setNextCursor(res.nextCursor);
      setHasNextPage(res.hasNextPage);
      if (opts?.reset) {
        setCursor(null);
      } else if (opts?.cursor) {
        setCursor(opts.cursor);
      }
    } catch (e) {
      console.error(e);
    } finally { setLoadingUsers(false); }
  }, [searchQuery, activity]);

  useEffect(()=>{ fetchUsers({ reset:true }); }, [searchQuery, activity, fetchUsers]);

  const goNext = () => { if (hasNextPage && nextCursor) fetchUsers({ cursor: nextCursor }); };
  const goPrev = () => { /* simple strategy: refetch from start and walk until previous page - for brevity we track no prev stack here */ };

  const toggleSelect = (email: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n; });
  };

  const exportScope = async (scope: 'all'|'active'|'inactive'|'selected') => {
    try {
      setExporting(true); setExportBytes(0);
      const blob = await apiService.exportUsers({ scope, selectedEmails: scope==='selected'? Array.from(selected):[], format:'csv', onProgress: b=> setExportBytes(b) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `users-${scope}-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const response = await apiService.importUsers(file);
      setImportResults(response.results);
      toast({
        title: 'Import completed',
        description: `Successfully processed ${response.results.newEmployeesAdded + response.results.unchangedEmployees} users`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import users',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template with ad-id column
    const csvContent = "fullname,email,ad-id\nJohn Doe,john@example.com,john123\nJane Smith,jane@example.com,jane456";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Import, view, filter and export users</p>
      </div>
      <Tabs defaultValue="import" className="w-full">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="list">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Bulk User Import
              </CardTitle>
              <CardDescription>
                Upload an Excel or CSV file to import users in bulk. Existing users will be updated, and users not in the file will be removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userFile">Excel/CSV File</Label>
                <Input
                  id="userFile"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
                <p className="text-xs text-muted-foreground">
                  File must contain columns: <strong>fullname</strong>, <strong>email</strong>, and <strong>ad-id</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={importing}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Excel/CSV File
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Users not included in the file will be automatically removed</li>
                      <li>Email addresses must be unique and valid</li>
                      <li><strong>AD ID is required</strong> and will be used as the initial password for new users</li>
                      <li>All three columns (fullname, email, ad-id) are mandatory for each user</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-xs uppercase font-medium text-muted-foreground">Search</label>
              <Input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Name or email" />
            </div>
            <div className="flex gap-2">
              {(['all','active','inactive'] as const).map(f => (
                <Button key={f} variant={activity===f? 'default':'outline'} size="sm" onClick={()=> setActivity(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={exporting} onClick={()=>exportScope('all')}>Export All</Button>
              <Button size="sm" disabled={exporting} onClick={()=>exportScope('active')}>Active Export</Button>
              <Button size="sm" disabled={exporting} onClick={()=>exportScope('inactive')}>Inactive Export</Button>
              <Button size="sm" disabled={selected.size===0 || exporting} onClick={()=>exportScope('selected')}>Selected ({selected.size})</Button>
            </div>
          </div>
          {exporting && <div className="text-xs text-muted-foreground">Exporting… {exportBytes} bytes</div>}
          <Separator />
          <UserList users={users} selected={selected} toggleSelect={toggleSelect} />
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-muted-foreground">Page size: {pageSize}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={cursor===null || loadingUsers}>Prev</Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={!hasNextPage || loadingUsers}>Next</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Users;