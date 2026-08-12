import { MessageCircle } from "lucide-react";

export default function InboxIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-stone-400">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <MessageCircle size={22} />
      </span>
      <p className="text-sm">Select a conversation to view messages</p>
    </div>
  );
}
