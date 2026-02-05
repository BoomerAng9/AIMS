import * as React from "react"

export function useWindowSize() {
  const [width, setWidth] = React.useState<number>(() =>
    typeof window === "undefined" ? 0 : window.innerWidth
  )

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleResize = () => {
      setWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return width
}
