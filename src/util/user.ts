// deno-lint-ignore no-explicit-any
export const getName = (u: any): string => {
    if (u && typeof u === 'object' && 'first_name' in u) {
        return `${u.first_name} ${u.last_name ? u.last_name : ''}`.trim()
    }
    if (u && typeof u === 'object' && 'title' in u) {
        return u.title || 'Unknown'
    }
    return 'Unknown'
}
