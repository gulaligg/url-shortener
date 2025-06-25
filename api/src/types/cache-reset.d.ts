import 'cache-manager'

declare module 'cache-manager' {
    interface Cache {
        get<T = any>(key: string): Promise<T | undefined>
        set<T = any>(key: string, value: T, ttl?: number): Promise<void>
        del(key: string): Promise<void>
        reset(): Promise<void>
    }
}
