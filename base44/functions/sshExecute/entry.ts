import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Socket } from 'node:net';

/**
 * SSH reachability / execution endpoint.
 *
 * History: this used Deno.Command to shell out to the `ssh` binary. Backend
 * functions cannot spawn processes, so it never bundled and blocked deployment.
 * The pure-JS `ssh2` client was tried as a replacement and also cannot bundle
 * here — it ships native bindings (sshcrypto.node, cpufeatures.node) that do
 * not exist for this platform.
 *
 * So `test` performs a real TCP reachability check on host:port, and the
 * command-running actions report that execution is unavailable instead of
 * taking the whole deployment down with them.
 */
function checkReachable(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = new Socket();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ reachable: true }));
    socket.once('timeout', () => finish({ reachable: false, error: `Timed out after ${timeoutMs}ms` }));
    socket.once('error', (err) => finish({ reachable: false, error: err.message }));

    socket.connect(port, host);
  });
}

const EXEC_UNAVAILABLE =
  'Remote command execution is unavailable: this runtime cannot spawn processes, and no pure-JS SSH client can be bundled. The connection itself can still be tested.';

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

    const connections = await base44.asServiceRole.entities.SSHConnection.filter({
      id: connection_id,
      created_by: user.email,
    });

    if (connections.length === 0) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    const conn = connections[0];

    switch (action) {
      case 'test': {
        const result = await checkReachable(conn.host, conn.port || 22);

        if (!result.reachable) {
          await base44.asServiceRole.entities.SSHConnection.update(connection_id, {
            status: 'disconnected',
          });
          return Response.json({ success: false, error: result.error });
        }

        await base44.asServiceRole.entities.SSHConnection.update(connection_id, {
          status: 'connected',
          last_connected: new Date().toISOString(),
        });

        return Response.json({
          success: true,
          message: `Host ${conn.host}:${conn.port || 22} is reachable`,
        });
      }

      case 'execute': {
        if (!command) {
          return Response.json({ error: 'Command is required' }, { status: 400 });
        }
        return Response.json({ success: false, error: EXEC_UNAVAILABLE }, { status: 501 });
      }

      case 'listFiles': {
        return Response.json({ success: false, error: EXEC_UNAVAILABLE }, { status: 501 });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ SSH operation failed:', error);
    return Response.json({
      error: error.message || 'SSH operation failed',
    }, { status: 500 });
  }
});