'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PostActionButtons({ boardId, postId }: { boardId: string, postId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/boards/${boardId}`);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`삭제 실패: ${errorData.message}`);
      }
    } catch (error) {
      alert('서버 통신 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex gap-2">
      <Link 
        href={`/boards/${boardId}/${postId}/edit`} 
        className="px-5 py-2.5 font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
      >
        수정
      </Link>
      <button 
        onClick={handleDelete} 
        className="px-5 py-2.5 font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}