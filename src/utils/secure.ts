const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""
const BUFFER_KEY = process.env.BUFFER_KEY || ""
const ENCRYPT_METHOD = "aes-256-cbc"
const ENCODING = "hex"

export function encrypt(raw) {
  let iv = Buffer.from(BUFFER_KEY)
  let cipher = crypto.createCipheriv(ENCRYPT_METHOD, Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(raw)

  encrypted = Buffer.concat([encrypted, cipher.final()])

  return encrypted.toString(ENCODING)
}

export function decrypt(encrypted) {
  let iv = Buffer.from(BUFFER_KEY)
  let encryptedText = Buffer.from(encrypted, ENCODING)
  let decipher = crypto.createDecipheriv(ENCRYPT_METHOD, Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)

  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}
