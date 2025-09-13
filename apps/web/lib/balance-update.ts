/**
 * 余额更新工具函数
 * 用于处理finish接口响应并触发余额更新事件
 */

interface FinishResponse {
  balanceUpdated?: boolean;
  data?: {
    balance?: number;
    cost?: number;
  };
}

/**
 * 处理finish接口响应，检查是否需要触发余额更新事件
 * @param response finish接口的响应数据
 */
export function handleFinishResponse(response: FinishResponse) {
  if (response && response.balanceUpdated) {
    console.log('检测到余额更新标识，触发balanceUpdated事件');
    // 触发全局余额更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: {
          newBalance: response.data?.balance,
          cost: response.data?.cost,
          timestamp: Date.now()
        }
      }));
    }
  }
}

interface ResponseDataItem {
  [key: string]: unknown;
}

/**
 * 调用finish接口的封装函数
 * @param token JWT token
 * @param appName 工作流名称
 * @param responseData 响应数据
 * @returns Promise<FinishResponse>
 */
export async function callFinishAPI(token: string, appName: string, responseData: ResponseDataItem[]) {
  try {
    const response = await fetch('/shareAuth/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        appName,
        responseData
      })
    });

    const result = await response.json();
    
    // 处理响应，检查是否需要触发余额更新事件
    handleFinishResponse(result);
    
    return result;
  } catch (error) {
    console.error('调用finish接口失败:', error);
    throw error;
  }
}

interface BalanceUpdateDetail {
  newBalance?: number;
  cost?: number;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * 手动触发余额更新事件
 * 用于测试或其他需要手动触发的场景
 */
export function triggerBalanceUpdate(detail?: BalanceUpdateDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('balanceUpdated', {
      detail: detail || { timestamp: Date.now() }
    }));
  }
}

/**
 * 添加余额更新事件监听器
 * @param callback 回调函数
 * @returns 清理函数
 */
export function addBalanceUpdateListener(callback: (event: CustomEvent) => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener('balanceUpdated', callback as EventListener);
    
    // 返回清理函数
    return () => {
      window.removeEventListener('balanceUpdated', callback as EventListener);
    };
  }
  
  return () => {}; // 服务端环境返回空函数
}