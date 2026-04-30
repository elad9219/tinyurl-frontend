import axios from 'axios';

const axiosInstance = axios.create();

// Response interceptor with an advanced Retry Mechanism for CORS & Cold Starts
axiosInstance.interceptors.response.use(
    async (response) => {
        // Detect if the free server is waking up and returning an HTML loading page
        if (typeof response.data === 'string' && response.data.toLowerCase().includes('<html')) {
            const config = { ...response.config } as any;
            config._retryCount = (config._retryCount || 0) + 1;
            
            // Retry up to 10 times (approx 30 seconds total waiting)
            if (config._retryCount <= 10) {
                window.dispatchEvent(new Event('serverWakingUp'));
                await new Promise(resolve => setTimeout(resolve, 3000));
                return axiosInstance(config);
            }
            return Promise.reject(new Error("Server timeout"));
        }

        window.dispatchEvent(new Event('serverAwake'));
        return response;
    },
    async (error) => {
        // Identify standard cold start errors: 502, 503, 504, or absolute Network Error (CORS block)
        const isCorsOrNetworkError = 
            !error.response || 
            error.message === 'Network Error' || 
            error.code === 'ERR_NETWORK' ||
            error.response.status >= 500;

        if (isCorsOrNetworkError && error.config) {
            const config = { ...error.config } as any;
            config._retryCount = (config._retryCount || 0) + 1;

            if (config._retryCount <= 10) {
                window.dispatchEvent(new Event('serverWakingUp'));
                await new Promise(resolve => setTimeout(resolve, 3000));
                return axiosInstance(config);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;