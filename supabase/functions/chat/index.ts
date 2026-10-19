// Retired: this old endpoint is no longer used by Genesis Heritage and has been switched off for safety.
Deno.serve(() => new Response(JSON.stringify({ error: 'This feature has been retired.' }), { status: 410, headers: { 'Content-Type': 'application/json' } }))
