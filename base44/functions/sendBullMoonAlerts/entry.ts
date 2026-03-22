import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active alerts
    const alerts = await base44.asServiceRole.entities.BullMoonAlert.filter({
      is_active: true
    });

    if (alerts.length === 0) {
      return Response.json({ message: 'No active alerts', sent: 0 });
    }

    // Get all active custom bull dates
    const customDates = await base44.asServiceRole.entities.CustomBullDate.filter({
      is_active: true
    });

    // Calculate upcoming eclipses (next 7 days)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const upcomingEclipses = [];
    const newlyAddedDates = [];

    // Check custom dates
    for (const customDate of customDates) {
      const eclipseDate = new Date(customDate.eclipse_date);
      const createdDate = new Date(customDate.created_date);
      const daysUntil = Math.floor((eclipseDate - now) / (1000 * 60 * 60 * 24));
      
      // Check if this date was just added (within last hour)
      if (createdDate >= oneHourAgo) {
        newlyAddedDates.push({
          date: eclipseDate,
          daysUntil,
          type: customDate.eclipse_type || 'custom',
          description: customDate.description,
          isNew: true
        });
      }
      
      if (daysUntil >= 0 && daysUntil <= 2) {
        upcomingEclipses.push({
          date: eclipseDate,
          daysUntil,
          type: customDate.eclipse_type || 'custom',
          description: customDate.description
        });
      }
    }

    // Check natural eclipses (simplified - you'd want more accurate calculation)
    const lunarCycle = 29.53058867;
    const nodalCycle = 346.62;
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const knownNode = new Date('2000-01-18T00:00:00Z');

    for (let i = 0; i <= 7; i++) {
      const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const moonDiff = (checkDate - knownNewMoon) / (1000 * 60 * 60 * 24);
      const nodeDiff = (checkDate - knownNode) / (1000 * 60 * 60 * 24);
      
      const phase = (moonDiff % lunarCycle) / lunarCycle;
      const nodePhase = (nodeDiff % nodalCycle) / nodalCycle;
      
      const isNewOrFullMoon = (phase < 0.02 || phase > 0.98) || (phase > 0.48 && phase < 0.52);
      const nearNode = (nodePhase < 0.05 || nodePhase > 0.95) || (nodePhase > 0.45 && nodePhase < 0.55);
      
      if (isNewOrFullMoon && nearNode) {
        const daysUntil = i;
        if (daysUntil >= 0 && daysUntil <= 2) {
          upcomingEclipses.push({
            date: checkDate,
            daysUntil,
            type: phase < 0.5 ? 'solar' : 'lunar',
            description: phase < 0.5 ? 'Solar Eclipse' : 'Lunar Eclipse'
          });
        }
      }
    }

    // Send alerts
    let sentCount = 0;
    const sentToday = new Set();

    // Send immediate alerts for newly added custom dates
    for (const newDate of newlyAddedDates) {
      for (const alert of alerts) {
        const alertKey = `${alert.user_email}-${newDate.date.toISOString().split('T')[0]}-new`;
        if (sentToday.has(alertKey)) continue;
        sentToday.add(alertKey);

        const subject = `🚨 NEW Bull Moon Date Added: ${newDate.description || 'Eclipse'} on ${newDate.date.toLocaleDateString()}`;
        const body = `
🚀 ⚡ NEW BULL MOON EVENT ADDED ⚡

Admin just added a new Bull Moon date to the calendar!

📅 Date: ${newDate.date.toLocaleDateString()}
🌙 Type: ${newDate.type}
${newDate.description ? `📝 ${newDate.description}` : ''}
⏰ Days until event: ${newDate.daysUntil}

Mark your calendar and prepare to buy Kaspa following the Bull Moon strategy!

👉 Buy Kaspa: https://www.topperpay.com/?crypto=KAS
👉 Learn More: https://ttt.kaspa.org/#/BullMoon

Never miss a Bull Moon - The simplest way to accumulate KAS.

---
To unsubscribe, visit your profile settings.
        `;

        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'Bull Moon Alerts',
            to: alert.user_email,
            subject,
            body
          });
          sentCount++;
        } catch (err) {
          console.error(`Failed to send new date alert to ${alert.user_email}:`, err);
        }
      }
    }

    if (upcomingEclipses.length === 0 && newlyAddedDates.length === 0) {
      return Response.json({ message: 'No upcoming eclipses or new dates', sent: sentCount });
    }

    for (const eclipse of upcomingEclipses) {
      for (const alert of alerts) {
        // ALWAYS send on the exact day (daysUntil === 0) + respect user's days_before preference
        const shouldSend = eclipse.daysUntil === 0 || eclipse.daysUntil === alert.days_before;
        
        if (shouldSend) {
          // Prevent duplicate sends
          const alertKey = `${alert.user_email}-${eclipse.date.toISOString().split('T')[0]}-${eclipse.daysUntil}`;
          if (sentToday.has(alertKey)) continue;
          sentToday.add(alertKey);

          const isToday = eclipse.daysUntil === 0;
          const subject = isToday 
            ? `🌑 BULL MOON TODAY - ${eclipse.description || 'Eclipse'} - Buy Kaspa Now!`
            : `🌙 Bull Moon Alert: ${eclipse.description} in ${eclipse.daysUntil} day(s)!`;
          
          const body = `
🚀 ${isToday ? '⚡ BULL MOON TODAY ⚡' : 'Bull Moon Alert'}

${isToday 
  ? `${eclipse.description || 'Eclipse'} is happening RIGHT NOW! This is your opportunity to buy Kaspa!`
  : `${eclipse.description} is coming in ${eclipse.daysUntil} day(s)!`
}

📅 Date: ${eclipse.date.toLocaleDateString()}
🌙 Type: ${eclipse.type}

${isToday 
  ? '💎 BUY KASPA NOW - The Bull Moon is here!'
  : 'Get ready to buy Kaspa following the Bull Moon strategy.'}

👉 Buy Kaspa: https://www.topperpay.com/?crypto=KAS
👉 Learn More: https://ttt.kaspa.org/#/BullMoon

${isToday ? '⚡ Don\'t miss this opportunity! ⚡' : 'Never miss a Bull Moon - The simplest way to accumulate KAS.'}

---
To unsubscribe, visit your profile settings.
          `;

          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              from_name: 'Bull Moon Alerts',
              to: alert.user_email,
              subject,
              body
            });
            
            sentCount++;
          } catch (err) {
            console.error(`Failed to send to ${alert.user_email}:`, err);
          }
        }
      }
    }

    return Response.json({
      message: 'Alerts sent successfully',
      sent: sentCount,
      newDatesAdded: newlyAddedDates.length,
      upcomingEclipses: upcomingEclipses.length,
      recipients: alerts.length
    });

  } catch (error) {
    console.error('Alert send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});