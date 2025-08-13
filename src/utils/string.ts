export function escapeRegExp1(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}