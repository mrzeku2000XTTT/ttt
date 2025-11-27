import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                success: false,
                error: 'Unauthorized' 
            }, { status: 401 });
        }

        const { pin } = await req.json();
        
        if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
            return Response.json({ 
                success: false,
                error: 'PIN must be exactly 6 digits' 
            }, { status: 400 });
        }

        // Hash the PIN with SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        console.log('✅ PIN hashed successfully');

        return Response.json({
            success: true,
            hash: hashHex
        });

    } catch (error) {
        console.error('❌ Failed to hash PIN:', error.message);
        return Response.json({ 
            success: false,
            error: error.message
        }, { status: 500 });
    }
});