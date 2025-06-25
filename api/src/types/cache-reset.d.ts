import 'cache-manager'

declare module 'cache-manager' {
    interface Cache {
        get<T = unknown>(key: string): Promise<T | undefined>
        set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>
        del(key: string): Promise<void>
        reset(): Promise<void>
    }
}
