export async function syncToServer(data: any[]) {
    await fetch('http://localhost:8080/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}