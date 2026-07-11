declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    load(config: { coreURL: string; wasmURL: string }): Promise<void>
    writeFile(path: string, data: Uint8Array): Promise<void>
    exec(args: string[]): Promise<void>
    readFile(path: string): Promise<Uint8Array>
  }
}

declare module '@ffmpeg/util' {
  export function toBlobURL(url: string, mimeType: string): Promise<string>
}
