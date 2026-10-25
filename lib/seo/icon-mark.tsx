export function FlameMark({ size = 128 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M280 42c18 84-63 111-63 192 0 34 11 63 30 82-2-57 56-82 60-139 48 48 91 98 91 163 0 82-64 146-142 146S114 422 114 340c0-89 57-140 111-205 5 46 21 69 38 90-4-71 29-112 17-183Z"
        fill="currentColor"
      />
      <path
        d="M256 282c26 28 42 53 42 86a42 42 0 1 1-84 0c0-34 17-59 42-86Z"
        fill="#28272C"
      />
    </svg>
  )
}
