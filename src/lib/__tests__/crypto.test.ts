import { encrypt, decrypt } from "../crypto"

describe("crypto", () => {
  const originalEnv = process.env.ENCRYPTION_KEY
  const testKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

  beforeEach(() => {
    // テスト用の暗号化キーを設定（32バイト = 64文字のhex）
    process.env.ENCRYPTION_KEY = testKey
  })

  afterEach(() => {
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv
    } else {
      delete process.env.ENCRYPTION_KEY
    }
  })

  describe("encrypt", () => {
    it("should encrypt a string", () => {
      const plaintext = "test_access_token_12345"
      const encrypted = encrypt(plaintext)

      // 暗号化された文字列は "iv:ciphertext" の形式
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
      expect(encrypted).not.toBe(plaintext)
    })

    it("should produce different ciphertexts for same plaintext (due to random IV)", () => {
      const plaintext = "same_text"
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      // IVがランダムなので、同じ平文でも異なる暗号文になる
      expect(encrypted1).not.toBe(encrypted2)
    })

    it("should throw error for empty string", () => {
      expect(() => encrypt("")).toThrow("Text to encrypt cannot be empty")
    })

    it("should handle special characters", () => {
      const plaintext = "token!@#$%^&*()_+-=[]{}|;:,.<>?"
      const encrypted = encrypt(plaintext)
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    })

    it("should handle Japanese characters", () => {
      const plaintext = "テストトークン"
      const encrypted = encrypt(plaintext)
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    })
  })

  describe("decrypt", () => {
    it("should decrypt an encrypted string", () => {
      const plaintext = "test_access_token_12345"
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it("should throw error for empty encrypted text", () => {
      expect(() => decrypt("")).toThrow("Encrypted text cannot be empty")
    })

    it("should decrypt special characters", () => {
      const plaintext = "token!@#$%^&*()_+-=[]{}|;:,.<>?"
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it("should decrypt Japanese characters", () => {
      const plaintext = "テストトークン"
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it("should handle long strings", () => {
      const plaintext = "a".repeat(1000)
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it("should throw error for invalid format", () => {
      expect(() => decrypt("invalid")).toThrow()
    })

    it("should throw error for malformed ciphertext", () => {
      expect(() => decrypt("00112233:invalid_hex")).toThrow()
    })
  })

  describe("encryption key validation", () => {
    it("should throw error if ENCRYPTION_KEY is not set", () => {
      delete process.env.ENCRYPTION_KEY

      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY environment variable is not set"
      )
    })

    it("should throw error if ENCRYPTION_KEY is too short", () => {
      process.env.ENCRYPTION_KEY = "short"

      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY must be 64 characters (32 bytes hex)"
      )
    })
  })

  describe("round-trip encryption", () => {
    const testCases = [
      { name: "short token", value: "abc123" },
      { name: "long token", value: "a".repeat(500) },
      { name: "unicode", value: "🎉🎊🎈" },
      { name: "mixed", value: "Test123!@#テスト🎉" },
    ]

    testCases.forEach(({ name, value }) => {
      it(`should correctly encrypt and decrypt ${name}`, () => {
        const encrypted = encrypt(value)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(value)
      })
    })
  })
})
