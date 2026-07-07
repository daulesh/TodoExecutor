"use client";

import { getBrowserApiBase } from "./api-base";

const API_BASE_URL = getBrowserApiBase();

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

class FetchClient {
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];

    private getAccessToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
        }
        return null;
    }

    private getRefreshToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("refresh_token");
        }
        return null;
    }

    private setTokens(access: string, refresh: string) {
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
        }
    }

    private clearTokens() {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
        }
    }

    private onRefreshed(token: string) {
        this.refreshSubscribers.map((cb) => cb(token));
        this.refreshSubscribers = [];
    }

    private addRefreshSubscriber(cb: (token: string) => void) {
        this.refreshSubscribers.push(cb);
    }

    async request(path: string, options: FetchOptions = {}): Promise<any> {
        const url = `${API_BASE_URL}${path}`;
        const headers = new Headers(options.headers || {});

        // Content-Type default
        if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        // Auth Header
        if (!options.skipAuth) {
            const token = this.getAccessToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
        }

        const config = {
            ...options,
            headers,
        };

        let response = await fetch(url, config);

        // Handle Token Expiration
        if (response.status === 401 && !options.skipAuth) {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                this.clearTokens();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("auth_expired"));
                }
                throw new Error("Session expired");
            }

            if (!this.isRefreshing) {
                this.isRefreshing = true;
                
                try {
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (refreshResponse.ok) {
                        const data = await refreshResponse.json();
                        this.setTokens(data.access_token, data.refresh_token);
                        this.isRefreshing = false;
                        this.onRefreshed(data.access_token);
                    } else {
                        // Refresh token also expired/invalidated
                        this.isRefreshing = false;
                        this.clearTokens();
                        if (typeof window !== "undefined") {
                            window.dispatchEvent(new Event("auth_expired"));
                        }
                        throw new Error("Session expired");
                    }
                } catch (err) {
                    this.isRefreshing = false;
                    
                    // Do not log out the user if the server is temporarily offline or restarting.
                    // Failed to fetch is thrown on network disconnect/server connection refused.
                    const isNetworkError = err instanceof TypeError || 
                                           (err instanceof Error && (
                                               err.message.includes("Failed to fetch") || 
                                               err.message.includes("NetworkError") ||
                                               err.message.includes("network")
                                           ));
                                           
                    if (isNetworkError) {
                        console.warn("Network error during token refresh. Retaining session state.");
                        throw err;
                    }
                    
                    this.clearTokens();
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("auth_expired"));
                    }
                    throw err;
                }
            }

            // Queue requests while refreshing
            const retryRequest = new Promise((resolve) => {
                this.addRefreshSubscriber((newToken: string) => {
                    headers.set("Authorization", `Bearer ${newToken}`);
                    resolve(fetch(url, { ...options, headers }));
                });
            });

            response = (await retryRequest) as Response;
        }

        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.detail || "Something went wrong",
                errorCode: data.error_code || "UNKNOWN_ERROR",
            };
        }

        return data;
    }

    async get(path: string, options: FetchOptions = {}) {
        return this.request(path, { ...options, method: "GET" });
    }

    async post(path: string, body: any, options: FetchOptions = {}) {
        return this.request(path, {
            ...options,
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    async put(path: string, body: any, options: FetchOptions = {}) {
        return this.request(path, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async patch(path: string, body: any, options: FetchOptions = {}) {
        return this.request(path, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }

    async delete(path: string, options: FetchOptions = {}) {
        return this.request(path, { ...options, method: "DELETE" });
    }
}

export const api = new FetchClient();
export default api;
