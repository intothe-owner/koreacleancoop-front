import { Suspense } from "react";
import ExamJoinContent from "./ExamJoinContent";

export default function ExamJoinPage() {
  return (
    <Suspense fallback={<ExamJoinLoading />}>
      <ExamJoinContent />
    </Suspense>
  );
}

function ExamJoinLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}