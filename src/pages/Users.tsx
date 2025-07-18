
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Users as UsersIcon, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ImportResults } from '@/types';

const Users: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
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
    // Create a sample Excel template
    const csvContent = "fullname,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Import and manage system users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Bulk User Import
            </CardTitle>
            <CardDescription>
              Upload an Excel file to import users in bulk. Existing users will be updated, and users not in the file will be removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userFile">Excel File</Label>
              <Input
                id="userFile"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
              />
              <p className="text-xs text-muted-foreground">
                File should contain columns: fullname, email
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
                    Upload Excel File
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
                    <li>Default password will be generated for new users</li>
                    <li>Existing users will receive email notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              Import Results
            </CardTitle>
            <CardDescription>
              Summary of the last import operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-green-800">New Users Added</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {importResults.newEmployeesAdded}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Unchanged Users</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {importResults.unchangedEmployees}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Users Removed</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {importResults.formerEmployeesRemoved}
                    </Badge>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Errors:</h4>
                    <div className="space-y-1">
                      {importResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No import results to display</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a file to see import statistics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Users;
