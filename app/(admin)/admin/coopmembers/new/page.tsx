import CoopMemberForm from "@/components/admin/CoopMemberForm";
import { Building2 } from "lucide-react";

export default function NewCoopMemberPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={28} />
          새 조합원 등록
        </h2>
      </div>
      <CoopMemberForm isEdit={false} />
    </div>
  );
}