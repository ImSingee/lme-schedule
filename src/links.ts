const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwM2N2aHFibGFqamRuN2tmZWcya3d1OHduIiwiaWF0IjoxNzMyMTcyMzY1LCJhIjp7ImxtZS0qIjoiciJ9fQ.HLB7jINlZ5gDPK_iyLyg7wsy3PoiWXB3u2Mln6uzEgs'


export async function handleLinksAPI() {
    const [messages, realtime] = await Promise.all([getBoxMessages(), getBoxRealtime()]);

    return {
        messages,
        realtime
    }
}

export async function getBoxRealtime() {
    const response = await fetch('https://jsonbin.singee.workers.dev/lme-box-realtime', {
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    })

    return response.json<{note: string, updatedAt: string}>()
}

export async function getBoxMessages() {
    const response = await fetch('https://jsonbin.singee.workers.dev/lme-box', {
        headers: {
            'Authorization': `Bearer ${token}` 
        }
    })

    const messages = await response.json<unknown[]>();

    return messages.reverse()
}