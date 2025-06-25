export const urlEncodeObject = (object: object, key: string) => {
    const params = new URLSearchParams()

    const buildParams = (obj: any, prefix: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const newPrefix = Array.isArray(obj)
                        ? `${prefix}[${key}]`
                        : prefix
                        ? `${prefix}[${key}]`
                        : key
                    buildParams(obj[key], newPrefix)
                }
            }
        } else {
            params.append(prefix, obj)
        }
    }

    buildParams({ [key]: object })

    return params
}
