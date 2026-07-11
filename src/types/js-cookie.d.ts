declare module 'js-cookie' {
  export function get(name: string): string | undefined
  export function set(name: string, value: string, attributes?: { expires?: number | Date; path?: string; domain?: string; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): string
  export function remove(name: string, attributes?: { path?: string; domain?: string }): void
}
