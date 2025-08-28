import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User } from '@/types';

interface Props {
  users: Array<User & { status?: string }>;
  selected: Set<string>;
  toggleSelect: (email: string) => void;
}

export const UserList: React.FC<Props> = ({ users, selected, toggleSelect }) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="px-3 py-2 w-8"><Checkbox checked={users.length>0 && users.every(u=>selected.has(u.email))} onCheckedChange={(v)=>{
              const all = users.every(u=>selected.has(u.email));
              users.forEach(u=>toggleSelect(u.email));
            }} /></th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Last Sign In</th>
            <th className="px-3 py-2">Sign Ins</th>
            <th className="px-3 py-2">Docs Viewed</th>
            <th className="px-3 py-2">Time Spent (min)</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const last = u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : '—';
            const timeMin = Math.round((u.timeSpent||0)/60);
            return (
              <tr key={u.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 align-middle"><Checkbox checked={selected.has(u.email)} onCheckedChange={()=>toggleSelect(u.email)} /></td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">{u.fullname}</td>
                <td className="px-3 py-2 whitespace-nowrap">{u.email}</td>
                <td className="px-3 py-2"><Badge variant="secondary">{u.role}</Badge></td>
                <td className="px-3 py-2">{last}</td>
                <td className="px-3 py-2 text-center">{u.numberOfSignIns}</td>
                <td className="px-3 py-2 text-center">{u.documentsViewed}</td>
                <td className="px-3 py-2 text-center">{timeMin}</td>
                <td className="px-3 py-2">{u.status === 'active' ? <Badge className="bg-green-600 hover:bg-green-600">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">No users found</div>
      )}
    </div>
  );
};

export default UserList;
