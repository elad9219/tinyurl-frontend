
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

interface RetryableRequestConfig extends AxiosRequestConfig {
    _readRetryCount?: number;
}

const axiosInstance = axios.create({
    timeout: 20000,
});

// Only read-only GET requests may be automatically repeated.
// Retrying POST after a lost response can create duplicate users or links.
axiosInstance.interceptors.response.use(
    (response) => {
        if (
            typeof response.data === 'string' &&
            /<!doctype html|<html/i.test(response.data.slice(0, 500))
        ) {
            return Promise.reject(
                new Error('The server returned an unexpected page. Please try again.')
            );
        }
        return response;
    },
    async (error: AxiosError) => {
        const config = error.config as RetryableRequestConfig | undefined;
        const method = (config?.method || 'get').toLowerCase();
        const status = error.response?.status;
        const retryable =
            status === 502 ||
            status === 503 ||
            status === 504 ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED' ||
            error.message === 'Network Error';

        if (!config || method !== 'get' || !retryable || config.signal?.aborted) {
            return Promise.reject(error);
        }

        const retryCount = (config._readRetryCount || 0) + 1;
        if (retryCount > 2) {
            return Promise.reject(error);
        }

        config._readRetryCount = retryCount;
        await new Promise<void>((resolve) => {
            setTimeout(resolve, retryCount * 2000);
        });

        if (config.signal?.aborted) {
            return Promise.reject(error);
        }

        return axiosInstance(config);
    }
);

export default axiosInstance;
