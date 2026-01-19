// components/layout/ContentPanel.tsx
export default function ContentPanel({ children }: any) {
  return (
    <div className="absolute inset-x-0 top-[10vh] z-20 flex justify-center">
      <div className="w-[90%] max-w-2xl">
        {children}
      </div>
    </div>
  )
}
