import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Bookmarked: React.FC = () => {
  const { user } = useAuth();
  const bookmarks = user?.recentDocs || [];

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Bookmarked Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {bookmarks.length === 0 ? (
            <p className="text-muted-foreground">You have no bookmarked documents.</p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.map((doc, idx) => (
                <li key={idx} className="p-2 bg-muted rounded">
                  {doc}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Bookmarked; 