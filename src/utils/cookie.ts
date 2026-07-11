import Cookies from 'js-cookie'

export function getCookie(name: string): string | undefined {
  return Cookies.get(name)
}

export function setCookie(name: string, value: string, days: number = 365) {
  Cookies.set(name, value, { expires: days })
}
