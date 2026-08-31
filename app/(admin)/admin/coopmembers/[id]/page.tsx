"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CoopMemberForm from "@/components/admin/CoopMemberForm";
import { Building2 } from "lucide-react";

export default function EditCoopMemberPage() {
  const params = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchMember = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members/${params.id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    };
    if (params.id) fetchMember();
  }, [params.id]);

  if (!data) return <div className="p-10 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={28} />
          조합원 정보 수정
        </h2>
      </div>
      <CoopMemberForm isEdit={true} initialData={data} />
    </div>
  );
}