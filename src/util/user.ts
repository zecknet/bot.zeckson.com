import { User } from "grammy"

export const getName = (u: User): string => {
    return `${u.first_name} ${u.last_name ? u.last_name : ''}`
}
