import { cn } from "../utils"

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("foo", "bar")
      expect(result).toBe("foo bar")
    })

    it("should handle conditional classes", () => {
      const result = cn("foo", false && "bar", "baz")
      expect(result).toBe("foo baz")
    })

    it("should merge Tailwind classes correctly", () => {
      // twMergeが重複するTailwindクラスをマージ
      const result = cn("px-2 py-1", "px-4")
      expect(result).toBe("py-1 px-4")
    })

    it("should handle arrays", () => {
      const result = cn(["foo", "bar"])
      expect(result).toBe("foo bar")
    })

    it("should handle objects", () => {
      const result = cn({ foo: true, bar: false, baz: true })
      expect(result).toBe("foo baz")
    })

    it("should handle undefined and null", () => {
      const result = cn("foo", undefined, null, "bar")
      expect(result).toBe("foo bar")
    })

    it("should handle empty input", () => {
      const result = cn()
      expect(result).toBe("")
    })

    it("should merge complex Tailwind classes", () => {
      const result = cn("text-sm font-medium", "text-lg", {
        "text-red-500": false,
        "text-blue-500": true,
      })
      // text-lgが後なのでtext-smを上書き
      expect(result).toContain("text-lg")
      expect(result).toContain("font-medium")
      expect(result).toContain("text-blue-500")
      expect(result).not.toContain("text-sm")
      expect(result).not.toContain("text-red-500")
    })
  })
})
