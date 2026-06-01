// 通用数据加密模块 — Web Crypto API
// 敏感数据（合同、工资、证据）加密存储

class DataEncryption {
  static ALGORITHM = { name: 'AES-GCM', length: 256 };
  static KEY_USAGE = ['encrypt', 'decrypt'];

  // 生成加密密钥（基于用户密码或设备指纹）
  static async generateKey(password = 'default-key') {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password),
      { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('labor-apps-salt'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial, this.ALGORITHM, false, this.KEY_USAGE
    );
  }

  // 加密数据
  static async encrypt(data, password) {
    const key = await this.generateKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key, enc.encode(JSON.stringify(data))
    );
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  // 解密数据
  static async decrypt(encryptedObj, password) {
    const key = await this.generateKey(password);
    const iv = new Uint8Array(encryptedObj.iv);
    const data = new Uint8Array(encryptedObj.data);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key, data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  }

  // 安全存储到localStorage
  static async secureSet(key, value, password) {
    const encrypted = await this.encrypt(value, password);
    localStorage.setItem(key + '_enc', JSON.stringify(encrypted));
  }

  // 从localStorage安全读取
  static async secureGet(key, password) {
    const raw = localStorage.getItem(key + '_enc');
    if (!raw) return null;
    try {
      return await this.decrypt(JSON.parse(raw), password);
    } catch {
      return null; // 密码错误或数据损坏
    }
  }

  // 生成设备指纹（简单版本，用于无密码场景）
  static deviceFingerprint() {
    const info = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    let hash = 0;
    for (let i = 0; i < info.length; i++) {
      const char = info.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash).toString(36);
  }
}
