import crypto from "crypto"

const ALGORITHM = "aes-256-cbc"

/**
 * 暗号化キーを取得
 * ENCRYPTION_KEY環境変数から取得（32バイト = 64文字のhex）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes hex)")
  }
  return Buffer.from(key, "hex")
}

/**
 * テキストを暗号化
 * @param text 暗号化するテキスト
 * @returns 暗号化されたテキスト（iv:encryptedData形式）
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error("Text to encrypt cannot be empty")
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16) // 初期化ベクトル（16バイト）

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  // IV と暗号化データを結合（復号時に必要）
  return `${iv.toString("hex")}:${encrypted}`
}

/**
 * テキストを復号化
 * @param encryptedText 暗号化されたテキスト（iv:encryptedData形式）
 * @returns 復号化されたテキスト
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error("Encrypted text cannot be empty")
  }

  const parts = encryptedText.split(":")
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format")
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(parts[0], "hex")
  const encryptedData = parts[1]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encryptedData, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
