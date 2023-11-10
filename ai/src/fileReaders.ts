import fs from 'fs'

const readFile = (path: string): string => {
    if (!fs.existsSync(path)) {
        throw new Error(`File ${path} does not exist`)
    }
    return fs.readFileSync(path, 'utf8')
}

const smartParseFile = (path: string): any => {
    const content = readFile(path)
    try {
        return JSON.parse(content)
    } catch (e) {
        // otherwise return the raw content
        return content
    }
}

export { smartParseFile }
