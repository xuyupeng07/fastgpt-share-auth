import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'fastgpt-secure-secret-key-2024';
const JWT_ISSUER = process.env.JWT_ISSUER || 'fastgpt-auth';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'fastgpt-share';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// Token payload接口
export interface TokenPayload {
  uid: string;
  userId: number;
  username: string;
  shareId?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string;
}

// Token验证结果接口
export interface TokenValidationResult {
  success: boolean;
  message?: string;
  data?: {
    uid: string;
    userId: number;
    username: string;
    permissions?: string[];
  };
}

// Token黑名单存储（生产环境建议使用Redis）
const tokenBlacklist = new Set<string>();

// 频率限制存储（生产环境建议使用Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 生成安全的JWT token
 * @param userId 用户ID
 * @param username 用户名
 * @param uid 用户唯一标识
 * @param shareId 分享链接ID（可选）
 * @param permissions 权限列表（可选）
 * @returns JWT token字符串
 */
export function generateSecureToken(
  userId: number,
  username: string,
  uid: string,
  shareId?: string,
  permissions: string[] = []
): string {
  const jti = crypto.randomUUID(); // 唯一标识符
  
  const payload = {
    userId,
    username,
    uid,
    shareId,
    permissions,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

/**
 * 验证JWT token
 * @param token JWT token字符串
 * @param shareId 分享链接ID（可选，用于验证权限）
 * @param clientIP 客户端IP（用于频率限制）
 * @returns 验证结果
 */
export async function validateToken(
  token: string,
  shareId?: string,
  clientIP?: string
): Promise<TokenValidationResult> {
  try {
    // 快速检查token格式，如果不是JWT格式就静默返回失败
    if (!token || !token.includes('.') || token.split('.').length !== 3) {
      return { success: false, message: 'Token格式无效' };
    }
    
    // 1. JWT签名验证
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }) as TokenPayload;
    
    // 2. 检查token是否在黑名单中
    if (tokenBlacklist.has(decoded.jti)) {
      return { success: false, message: 'Token已被撤销' };
    }
    
    // 3. 验证shareId匹配（如果提供）
    if (shareId && decoded.shareId && decoded.shareId !== shareId) {
      return { success: false, message: '访问权限不匹配' };
    }
    
    // 4. 频率限制检查
    if (clientIP) {
      const rateLimitKey = `${decoded.uid}:${clientIP}`;
      const rateLimitOk = checkRateLimit(rateLimitKey);
      if (!rateLimitOk) {
        return { success: false, message: '访问频率过高，请稍后再试' };
      }
    }
    
    return {
      success: true,
      data: {
        uid: decoded.uid,
        userId: decoded.userId,
        username: decoded.username,
        permissions: decoded.permissions
      }
    };
    
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, message: 'Token已过期' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, message: 'Token格式无效' };
    } else {
      // 只在非JWT格式错误时输出日志
      console.error('Token验证错误:', error);
      return { success: false, message: '身份验证失败' };
    }
  }
}

/**
 * 撤销token（加入黑名单）
 * @param tokenOrJti JWT token字符串或jti
 */
export function revokeToken(tokenOrJti: string): void {
  try {
    let jti: string;
    
    if (tokenOrJti.includes('.')) {
      // 是完整的JWT token
      const decoded = jwt.decode(tokenOrJti) as TokenPayload;
      jti = decoded?.jti;
    } else {
      // 是jti
      jti = tokenOrJti;
    }
    
    if (jti) {
      tokenBlacklist.add(jti);
    }
  } catch (error) {
    console.error('撤销token失败:', error);
  }
}

/**
 * 刷新token
 * @param oldToken 旧的JWT token
 * @returns 新的JWT token
 */
export function refreshToken(oldToken: string): string | null {
  try {
    const decoded = jwt.verify(oldToken, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      ignoreExpiration: true // 允许过期的token用于刷新
    }) as TokenPayload;
    
    // 撤销旧token
    revokeToken(decoded.jti);
    
    // 生成新token
    return generateSecureToken(
      decoded.userId,
      decoded.username,
      decoded.uid,
      decoded.shareId,
      decoded.permissions
    );
    
  } catch (error) {
    console.error('刷新token失败:', error);
    return null;
  }
}

/**
 * 检查频率限制
 * @param key 限制键（通常是用户ID+IP）
 * @param maxRequests 最大请求数（默认10次）
 * @param windowMs 时间窗口（默认1分钟）
 * @returns 是否允许请求
 */
function checkRateLimit(
  key: string,
  maxRequests: number = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  windowMs: number = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // 新的时间窗口
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * 清理过期的频率限制记录
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 获取token信息（不验证签名）
 * @param token JWT token字符串
 * @returns token payload或null
 */
export function getTokenInfo(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 验证token是否即将过期
 * @param token JWT token字符串
 * @param thresholdMinutes 阈值分钟数（默认30分钟）
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMinutes: number = 30
): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const threshold = thresholdMinutes * 60;
    
    return (decoded.exp - now) <= threshold;
  } catch (error) {
    return true;
  }
}

// 定期清理频率限制记录（从环境变量读取间隔时间）
const CLEANUP_INTERVAL = parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL || '300000');
setInterval(cleanupRateLimit, CLEANUP_INTERVAL);