// CLIENT-SIDE ADAPTER
// In this serverless environment, this client handles missing endpoints gracefully.

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

export const apiFetch = async <T>(path: string, _options: ApiOptions = {}): Promise<T> => {
  console.warn(`[MockAPI] Call intercepted to ${path}. Ensure the service is mocked correctly.`);
  
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      console.error(`[MockAPI] 404 Not Found (Simulated): ${path}`);
      reject(new Error(`Endpoint ${path} not available in Client-Only mode.`));
    }, 500);
  });
};
