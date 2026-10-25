import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Logo" width={35} height={35} />
        <span className="text-lg">Fuse</span>
    </div>
  )
}
