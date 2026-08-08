import { Loader2, Sparkles } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#0B2A55] to-[#0891B2] flex items-center justify-center text-white shadow-lg animate-pulse">
          <Sparkles className="w-7 h-7 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#22D3EE] ring-4 ring-white flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-[#0B2A55] animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-cambria text-base font-bold text-[#0B2A55]">
          Loading Clinical Portal...
        </p>
        <p className="text-xs text-[#64748B]">
          Fetching real-time records and updating workspace...
        </p>
      </div>
    </div>
  );
}
