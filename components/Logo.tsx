import { Flame } from "lucide-react";
import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
        <Flame className="text-primary" size={32} />
        <span className="text-lg hidden">Fuse</span>
    </div>
  )
}
