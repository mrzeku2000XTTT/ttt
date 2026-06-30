/**
 * Agent Bridge Listener — injects postMessage communication into pages loaded in the Agent Computer.
 * This script should be injected as a <script> tag into the iframe's document.
 * It enables the parent window to communicate with the page via postMessage.
 */
(function() {
  const AGENT_NS = "ttt-agent";
  
  // Prevent double-injection
  if (window.__AGENT_BRIDGE_INJECTED__) return;
  window.__AGENT_BRIDGE_INJECTED__ = true;
  
  // Send ready signal to parent
  function sendReady() {
    window.parent.postMessage({
      ns: AGENT_NS,
      type: "ready",
      url: window.location.pathname
    }, "*");
  }
  
  // Handle commands from parent
  window.addEventListener("message", async (e) => {
    const msg = e.data;
    if (!msg || msg.ns !== AGENT_NS || msg.type !== "command") return;
    
    const { id, command } = msg;
    
    try {
      const result = await executeCommand(command);
      window.parent.postMessage({
        ns: AGENT_NS,
        type: "response",
        id,
        payload: result
      }, "*");
    } catch (err) {
      window.parent.postMessage({
        ns: AGENT_NS,
        type: "response",
        id,
        payload: { ok: false, error: err.message }
      }, "*");
    }
  });
  
  // Execute command
  async function executeCommand(command) {
    const { action } = command;
    
    switch (action) {
      case "ping":
        return { ok: true, timestamp: Date.now() };
      
      case "read_page": {
        const url = window.location.pathname;
        const title = document.title;
        
        // Extract visible headings
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"))
          .slice(0, 15)
          .map(h => h.textContent?.trim() || "")
          .filter(t => t.length > 0);
        
        // Extract clickable elements (buttons, links)
        const buttons = Array.from(document.querySelectorAll("button, [role='button'], a[href]"))
          .slice(0, 30)
          .map(el => {
            const text = el.textContent?.trim() || "";
            const ariaLabel = el.getAttribute("aria-label") || "";
            const agentId = el.getAttribute("data-agent-id") || "";
            const type = el.tagName.toLowerCase();
            const label = agentId || ariaLabel || text;
            return agentId ? `${text} [#${agentId}]` : label;
          })
          .filter(t => t.length > 2);
        
        // Extract input fields
        const inputs = Array.from(document.querySelectorAll("input, textarea"))
          .slice(0, 20)
          .map(el => {
            const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = el.getAttribute("placeholder")?.toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";
            const type = el.tagName.toLowerCase();
            const value = el.value || "";
            
            // Find the most descriptive label
            const label = ariaLabel || placeholder || id || "input";
            return `${label.toLowerCase()} (${type})${value ? ` = "${value.slice(0, 100)}"` : ""}`;
          })
          .filter(item => item.length > 3);
        
        return {
          ok: true,
          url,
          title,
          headings,
          buttons,
          inputs,
          timestamp: Date.now()
        };
      }
      
      case "locate": {
        // Find element by text content or data-agent-id
        const text = command.text;
        if (!text) return { ok: false, error: "no_text" };
        
        // Try data-agent-id first (most reliable)
        let el = document.querySelector(`[data-agent-id="${text}"]`);
        
        // Try buttons by text content
        if (!el) {
          el = Array.from(document.querySelectorAll("button, [role='button']"))
            .find(btn => btn.textContent?.trim().toLowerCase().includes(text.toLowerCase()));
        }
        
        // Try links
        if (!el) {
          el = Array.from(document.querySelectorAll("a"))
            .find(link => link.textContent?.trim().toLowerCase().includes(text.toLowerCase()));
        }
        
        if (!el) {
          return { ok: false, error: "not_found" };
        }
        
        const rect = el.getBoundingClientRect();
        return {
          ok: true,
          position: {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          },
          element: el.tagName,
          visible: isElementVisible(el)
        };
      }
      
      case "locate_input": {
        const label = command.label;
        if (!label) return { ok: false, error: "no_label" };
        
        // Find by aria-label, placeholder, or id
        const el = Array.from(document.querySelectorAll("input, textarea"))
          .find(input => {
            const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = input.getAttribute("placeholder")?.toLowerCase() || "";
            const id = input.id?.toLowerCase() || "";
            const searchText = label.toLowerCase();
            return ariaLabel.includes(searchText) || 
                   placeholder.includes(searchText) || 
                   id.includes(searchText);
          });
        
        if (!el) {
          return { ok: false, error: "not_found" };
        }
        
        const rect = el.getBoundingClientRect();
        return {
          ok: true,
          position: {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          }
        };
      }
      
      case "click_text": {
        const text = command.text;
        if (!text) return { ok: false, error: "no_text" };
        
        // Try data-agent-id first
        let el = document.querySelector(`[data-agent-id="${text}"]`);
        
        // Try buttons by text
        if (!el) {
          el = Array.from(document.querySelectorAll("button, [role='button']"))
            .find(btn => {
              const btnText = btn.textContent?.trim().toLowerCase() || "";
              const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
              return btnText.includes(text.toLowerCase()) || ariaLabel.includes(text.toLowerCase());
            });
        }
        
        if (!el) {
          return { ok: false, error: "not_found" };
        }
        
        if (!isElementVisible(el)) {
          return { ok: false, error: "not_visible" };
        }
        
        el.click();
        const rect = el.getBoundingClientRect();
        return {
          ok: true,
          position: {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          }
        };
      }
      
      case "type_into": {
        const label = command.label;
        const text = command.text;
        const charDelay = command.charDelay || 50;
        
        if (!label) return { ok: false, error: "no_label" };
        if (!text) return { ok: false, error: "no_text" };
        
        // Find input
        const el = Array.from(document.querySelectorAll("input, textarea"))
          .find(input => {
            const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = input.getAttribute("placeholder")?.toLowerCase() || "";
            const id = input.id?.toLowerCase() || "";
            const searchText = label.toLowerCase();
            return ariaLabel.includes(searchText) || 
                   placeholder.includes(searchText) || 
                   id.includes(searchText);
          });
        
        if (!el) {
          return { ok: false, error: "not_found" };
        }
        
        if (!isElementVisible(el)) {
          return { ok: false, error: "not_visible" };
        }
        
        // Focus and type
        el.focus();
        el.value = ""; // Clear first
        
        // Type character by character
        for (let i = 0; i < text.length; i++) {
          el.value += text[i];
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          await sleep(charDelay);
        }
        
        const rect = el.getBoundingClientRect();
        return {
          ok: true,
          position: {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          },
          typedLength: text.length
        };
      }
      
      case "scroll": {
        const y = command.y || 0;
        window.scrollTo({ top: y, behavior: "smooth" });
        return { ok: true, scrolledTo: y };
      }
      
      default:
        return { ok: false, error: "unknown_action" };
    }
  }
  
  // Utility: check if element is visible
  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0
    );
  }
  
  // Utility: sleep
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Send ready signal on load
  if (document.readyState === "complete") {
    sendReady();
  } else {
    window.addEventListener("load", sendReady);
  }
  
  // Also send ready on navigation (for SPA)
  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(sendReady, 500);
    }
  }, 500);
})();