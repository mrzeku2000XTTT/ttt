import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const CONNECTOR_MAP = {
  googledrive: "6a8cde30137d405112693b7a",
  googledocs: "6a8cde51e37e03bca068b3b2",
  googlesheets: "6a8cde30137d405112693b7a", // Sheets uses Drive connector
  googlecalendar: "6a8cde500c8f9518850896d0",
  gmail: "6a8cde4f5e2470cbe4b913d5",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, connectorType, connectorId, createType, title, content, to, subject, body: emailBody, start, end, messageId, sheetId, range, values } = body;

    const cId = connectorId || CONNECTOR_MAP[connectorType];
    if (!cId) return Response.json({ error: "Unknown connector type" }, { status: 400 });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Get the current app user's connection (throws if not connected)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(cId);
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ connected: false, error: "Not connected. Click Connect in Settings." }, { status: 200 });
    }

    if (action === "status") {
      return Response.json({ connected: true, connectorType });
    }

    if (action === "fetch") {
      const authHeader = { Authorization: `Bearer ${accessToken}` };

      if (connectorType === "googledrive" || connectorType === "googlesheets") {
        const res = await fetch(
          "https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc",
          { headers: authHeader }
        );
        const data = await res.json();
        return Response.json({ files: data.files || [] });
      }

      if (connectorType === "googlecalendar") {
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          { headers: authHeader }
        );
        const data = await res.json();
        return Response.json({ events: data.items || [] });
      }

      if (connectorType === "gmail") {
        const res = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=in:inbox",
          { headers: authHeader }
        );
        const data = await res.json();
        const messages = [];
        for (const msg of (data.messages || []).slice(0, 5)) {
          const detail = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: authHeader }
          );
          const d = await detail.json();
          const headers = {};
          (d.payload?.headers || []).forEach((h) => { headers[h.name] = h.value; });
          messages.push({ id: msg.id, from: headers.From, subject: headers.Subject, date: headers.Date, snippet: d.snippet });
        }
        return Response.json({ messages });
      }

      if (connectorType === "googledocs") {
        const res = await fetch(
          "https://www.googleapis.com/drive/v3/files?pageSize=10&q=mimeType='application/vnd.google-apps.document'&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc",
          { headers: authHeader }
        );
        const data = await res.json();
        return Response.json({ docs: data.files || [] });
      }
    }

    if (action === "create") {
      const authHeader = { Authorization: `Bearer ${accessToken}` };
      const fileTitle = title || `Untitled ${createType === "sheet" ? "Spreadsheet" : "Document"}`;

      if (createType === "doc") {
        // Create a Google Doc via Drive API
        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ name: fileTitle, mimeType: "application/vnd.google-apps.document" }),
        });
        const file = await createRes.json();
        if (file.error) return Response.json({ error: file.error.message }, { status: 500 });

        // Add content via Docs API if provided
        if (content) {
          try {
            await fetch(`https://docs.googleapis.com/v1/documents/${file.id}:batchUpdate`, {
              method: "POST",
              headers: { ...authHeader, "Content-Type": "application/json" },
              body: JSON.stringify({
                requests: [{ insertText: { location: { index: 1 }, text: content } }],
              }),
            });
          } catch {}
        }

        return Response.json({
          id: file.id,
          url: `https://docs.google.com/document/d/${file.id}/edit`,
          title: fileTitle,
          type: "doc",
        });
      }

      if (createType === "sheet") {
        // Create a Google Sheet via Drive API
        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ name: fileTitle, mimeType: "application/vnd.google-apps.spreadsheet" }),
        });
        const file = await createRes.json();
        if (file.error) return Response.json({ error: file.error.message }, { status: 500 });

        return Response.json({
          id: file.id,
          url: `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
          title: fileTitle,
          type: "sheet",
        });
      }
    }

    // --- SEND EMAIL (Gmail) ---
    if (action === "send_email") {
      if (!to || !subject) return Response.json({ error: "Missing 'to' or 'subject'" }, { status: 400 });
      const authHeader = { Authorization: `Bearer ${accessToken}` };
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        emailBody || "",
      ].join("\r\n");
      const encoded = btoa(unescape(encodeURIComponent(email)));
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: encoded }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 500 });
      return Response.json({ sent: true, id: data.id, to, subject });
    }

    // --- READ FULL EMAIL BODY (Gmail) ---
    if (action === "read_email" && connectorType === "gmail") {
      if (!messageId) return Response.json({ error: "Missing 'messageId'" }, { status: 400 });
      const authHeader = { Authorization: `Bearer ${accessToken}` };
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      const d = await res.json();
      const headers = {};
      (d.payload?.headers || []).forEach((h) => { headers[h.name] = h.value; });
      // Extract plain text body
      let bodyText = d.snippet || "";
      try {
        const findPart = (part) => {
          if (part.mimeType === "text/plain" && part.body?.data) return part;
          if (part.parts) for (const p of part.parts) { const f = findPart(p); if (f) return f; }
          return null;
        };
        const tp = findPart(d.payload);
        if (tp?.body?.data) bodyText = decodeURIComponent(escape(atob(tp.body.data.replace(/-/g, "+").replace(/_/g, "/"))));
      } catch {}
      return Response.json({ id: d.id, from: headers.From, subject: headers.Subject, date: headers.Date, body: bodyText.slice(0, 2000) });
    }

    // --- CREATE CALENDAR EVENT ---
    if (action === "create_event" && connectorType === "googlecalendar") {
      if (!start || !end) return Response.json({ error: "Missing 'start' or 'end' (ISO datetime)" }, { status: 400 });
      const authHeader = { Authorization: `Bearer ${accessToken}` };
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: title || "Untitled Event",
          description: content || "",
          start: { dateTime: start },
          end: { dateTime: end },
        }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 500 });
      return Response.json({ id: data.id, summary: data.summary, link: data.htmlLink, start, end });
    }

    // --- APPEND TO SHEET ---
    if (action === "append_sheet" && (connectorType === "googlesheets" || connectorType === "googledrive")) {
      if (!sheetId || !values) return Response.json({ error: "Missing 'sheetId' or 'values'" }, { status: 400 });
      const authHeader = { Authorization: `Bearer ${accessToken}` };
      const rangeParam = range || "A1";
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rangeParam}:append?valueInputOption=RAW`,
        {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ values }),
        }
      );
      const data = await res.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 500 });
      return Response.json({ appended: true, updatedRange: data.updates?.updatedRange });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error.message?.includes("connection") || error.message?.includes("Connection") || error.status === 404) {
      return Response.json({ connected: false, error: "Not connected" }, { status: 200 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}