import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, connection_id, command } = await req.json();

        console.log('🔧 SSH Action:', action);
        console.log('👤 User:', user.email);

        switch (action) {
            case 'test': {
                // Test SSH connection
                const connections = await base44.asServiceRole.entities.SSHConnection.filter({
                    id: connection_id,
                    created_by: user.email
                });

                if (connections.length === 0) {
                    return Response.json({ error: 'Connection not found' }, { status: 404 });
                }

                const conn = connections[0];

                try {
                    // Use Deno's Command API to test SSH
                    const testCommand = new Deno.Command('ssh', {
                        args: [
                            '-p', String(conn.port),
                            '-o', 'StrictHostKeyChecking=no',
                            '-o', 'ConnectTimeout=5',
                            `${conn.username}@${conn.host}`,
                            'echo "SSH_TEST_SUCCESS"'
                        ],
                        stdin: 'piped',
                        stdout: 'piped',
                        stderr: 'piped'
                    });

                    const process = testCommand.spawn();

                    // If password auth, write password to stdin
                    if (conn.connection_type === 'password' && conn.password) {
                        const writer = process.stdin.getWriter();
                        await writer.write(new TextEncoder().encode(conn.password + '\n'));
                        await writer.close();
                    }

                    const { code, stdout, stderr } = await process.output();

                    if (code === 0) {
                        // Update last connected time
                        await base44.asServiceRole.entities.SSHConnection.update(connection_id, {
                            status: 'connected',
                            last_connected: new Date().toISOString()
                        });

                        return Response.json({
                            success: true,
                            message: 'SSH connection successful',
                            output: new TextDecoder().decode(stdout)
                        });
                    } else {
                        return Response.json({
                            success: false,
                            error: new TextDecoder().decode(stderr),
                            code: code
                        });
                    }
                } catch (err) {
                    console.error('SSH test failed:', err);
                    return Response.json({
                        success: false,
                        error: err.message
                    });
                }
            }

            case 'execute': {
                // Execute command via SSH
                const connections = await base44.asServiceRole.entities.SSHConnection.filter({
                    id: connection_id,
                    created_by: user.email
                });

                if (connections.length === 0) {
                    return Response.json({ error: 'Connection not found' }, { status: 404 });
                }

                const conn = connections[0];

                if (!command) {
                    return Response.json({ error: 'Command is required' }, { status: 400 });
                }

                try {
                    const sshCommand = new Deno.Command('ssh', {
                        args: [
                            '-p', String(conn.port),
                            '-o', 'StrictHostKeyChecking=no',
                            `${conn.username}@${conn.host}`,
                            command
                        ],
                        stdin: 'piped',
                        stdout: 'piped',
                        stderr: 'piped'
                    });

                    const process = sshCommand.spawn();

                    if (conn.connection_type === 'password' && conn.password) {
                        const writer = process.stdin.getWriter();
                        await writer.write(new TextEncoder().encode(conn.password + '\n'));
                        await writer.close();
                    }

                    const { code, stdout, stderr } = await process.output();

                    return Response.json({
                        success: code === 0,
                        output: new TextDecoder().decode(stdout),
                        error: code !== 0 ? new TextDecoder().decode(stderr) : null,
                        code: code
                    });
                } catch (err) {
                    console.error('SSH command failed:', err);
                    return Response.json({
                        success: false,
                        error: err.message
                    });
                }
            }

            case 'listFiles': {
                // List files in project directory
                const connections = await base44.asServiceRole.entities.SSHConnection.filter({
                    id: connection_id,
                    created_by: user.email
                });

                if (connections.length === 0) {
                    return Response.json({ error: 'Connection not found' }, { status: 404 });
                }

                const conn = connections[0];
                const path = conn.project_path || '~';

                try {
                    const lsCommand = new Deno.Command('ssh', {
                        args: [
                            '-p', String(conn.port),
                            '-o', 'StrictHostKeyChecking=no',
                            `${conn.username}@${conn.host}`,
                            `ls -la ${path}`
                        ],
                        stdin: 'piped',
                        stdout: 'piped',
                        stderr: 'piped'
                    });

                    const process = lsCommand.spawn();

                    if (conn.connection_type === 'password' && conn.password) {
                        const writer = process.stdin.getWriter();
                        await writer.write(new TextEncoder().encode(conn.password + '\n'));
                        await writer.close();
                    }

                    const { code, stdout, stderr } = await process.output();

                    return Response.json({
                        success: code === 0,
                        files: new TextDecoder().decode(stdout),
                        error: code !== 0 ? new TextDecoder().decode(stderr) : null
                    });
                } catch (err) {
                    console.error('List files failed:', err);
                    return Response.json({
                        success: false,
                        error: err.message
                    });
                }
            }

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ SSH operation failed:', error);
        return Response.json({ 
            error: error.message || 'SSH operation failed' 
        }, { status: 500 });
    }
});