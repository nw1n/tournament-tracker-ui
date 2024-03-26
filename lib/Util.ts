import { get } from 'lodash'

export function log(...msg: any[]) {
    console.log(...msg)
}

export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function formatTime(dateArg: Date | string | number) {
    const dateObj = new Date(dateArg)
    return (
        `${dateObj.getHours().toString().padStart(2, '0')}:` +
        `${dateObj.getMinutes().toString().padStart(2, '0')}:` +
        `${dateObj.getSeconds().toString().padStart(2, '0')}`
    )
}

export function unProxy(argArr: any[]) {
    const result = []
    for (const key of Object.keys(argArr)) {
        const arrItem = argArr[key as any]
        const resItem = {} as any
        for (const key2 of Object.keys(arrItem)) {
            resItem[key2] = arrItem[key2]
        }
        result.push(resItem)
    }
    return result
}

export function millisecondsToTime(ms: number) {
    console.log('ms', ms)
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    const secondsStr = (seconds % 60).toString().padStart(2, '0')
    const minutesStr = (minutes % 60).toString().padStart(2, '0')
    if (hours > 0) {
        const hoursStr = hours.toString().padStart(2, '0')
        return `${hoursStr}:${minutesStr}:${secondsStr}`
    }
    return `${minutesStr}:${secondsStr}`
}
