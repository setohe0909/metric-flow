import { Building } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function OrgSwitcher() {
  const { activeOrg } = useAuth();

  if (!activeOrg) return null;

  return (
    <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border-2 border-[#23251d] text-[#23251d] text-xs font-bold font-mono shadow-[2px_2px_0px_0px_#23251d]">
      <div className="p-1 bg-[#f7a501] border border-[#23251d] rounded-lg">
        <Building className="h-3.5 w-3.5" />
      </div>
      <span className="truncate">{activeOrg.name}</span>
    </div>
  );
}
