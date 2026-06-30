/**
 * Agent Bridge Listener — injected into pages loaded in the Agent Computer iframe.
 * Enables postMessage communication between the parent page and iframe content.
 */

(function() {
  const AGENT_NS = "ttt-agent";
  
  // Prevent double-injection
  if (window.__tttAgentBridgeInjected) return;
  window.__tttAgentBridgeInjected = true;
  
  // Signal ready state to parent
  function sendReady() {
    window.parent.postMessage({
      ns: AGENT_NS,
      type: "ready",
      url: window.location.pathname
    }, "*");
  }
  
  // Listen for commands from parent
  window.addEventListener("message", (e) => {
    const msg = e.data;
    if (!msg || msg.ns !== AGENT_NS || msg.type !== "command") return;
    
    const { id, command } = msg;
    const respond = (payload) => {
      window.parent.postMessage({
        ns: AGENT_NS,
        type: "response",
        id,
        payload
      }, "*");
    };
    
    // Execute command
    handleCommand(command)
      .then(respond)
      .catch((err) => respond({ ok: false, error: err.message }));
  });
  
  // Command handlers
  async function handleCommand(command) {
    switch (command.action) {
      case "ping":
        return { ok: true, timestamp: Date.now() };
      
      case "read_page": {
        const url = window.location.pathname;
        const title = document.title;
        
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4"))
          .slice(0, 15)
          .map(h => h.textContent?.trim() || "")
          .filter(t => t.length > 0);
        
        const buttons = Array.from(document.querySelectorAll("button, [role='button'], a[href]"))
          .slice(0, 30)
          .map(el => {
            const text = el.textContent?.trim() || "";
            const ariaLabel = el.getAttribute("aria-label") || "";
            const agentId = el.getAttribute("data-agent-id") || "";
            return agentId ? `${text} [#${agentId}]` : (ariaLabel || text);
          })
          .filter(t => t && t.length > 2);
        
        const inputs = Array.from(document.querySelectorAll("input, textarea"))
          .slice(0, 20)
          .map(el => {
            const ariaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = el.getAttribute("placeholder")?.toLowerCase() || "";
            const id = el.id?.toLowerCase() || "";
            const value = el.value || "";
            const label = ariaLabel || placeholder || id || "input";
            return `${label} (${el.tagName.toLowerCase()})${value ? ` = "${value.slice(0, 100)}"` : ""}`;
          })
          .filter(item => item.length > 3);
        
        return { ok: true, url, title, headings, buttons, inputs, timestamp: Date.now() };
      }
      
      case "locate": {
        const text = command.text;
        if (!text) return { ok: false, error: "no_text" };
        
        let el = document.querySelector(`[data-agent-id="${text}"]`);
        
        if (!el) {
          el = Array.from(document.querySelectorAll("button, [role='button']"))
            .find(btn => btn.textContent?.trim().toLowerCase().includes(text.toLowerCase()));
        }
        
        if (!el) {
          el = Array.from(document.querySelectorAll("a"))
            .find(link => link.textContent?.trim().toLowerCase().includes(text.toLowerCase()));
        }
        
        if (!el) return { ok: false, error: "not_found" };
        
        const rect = el.getBoundingClientRect();
        return {
          ok: true,
          position: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) },
          element: el.tagName,
          visible: isElementVisible(el)
        };
      }
      
      case "locate_input": {
        const label = command.label;
        if (!label) return { ok: false, error: "no_label" };
        
        const el = Array.from(document.querySelectorAll("input, textarea"))
          .find(input => {
            const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = input.getAttribute("placeholder")?.toLowerCase() || "";
            const id = input.id?.toLowerCase() || "";
            const searchText = label.toLowerCase();
            return ariaLabel.includes(searchText) || placeholder.includes(searchText) || id.includes(searchText);
          });
        
        if (!el) return { ok: false, error: "not_found" };
        
        const rect = el.getBoundingClientRect();
        return { ok: true, position: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) } };
      }
      
      case "click_text": {
        const text = command.text;
        if (!text) return { ok: false, error: "no_text" };
        
        let el = document.querySelector(`[data-agent-id="${text}"]`);
        
        if (!el) {
          el = Array.from(document.querySelectorAll("button, [role='button']"))
            .find(btn => {
              const btnText = btn.textContent?.trim().toLowerCase() || "";
              const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
              return btnText.includes(text.toLowerCase()) || ariaLabel.includes(text.toLowerCase());
            });
        }
        
        if (!el) return { ok: false, error: "not_found" };
        if (!isElementVisible(el)) return { ok: false, error: "not_visible" };
        
        el.click();
        const rect = el.getBoundingClientRect();
        return { ok: true, position: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) } };
      }
      
      case "type_into": {
        const label = command.label;
        const text = command.text;
        const charDelay = command.charDelay || 50;
        
        if (!label) return { ok: false, error: "no_label" };
        if (!text) return { ok: false, error: "no_text" };
        
        const el = Array.from(document.querySelectorAll("input, textarea"))
          .find(input => {
            const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
            const placeholder = input.getAttribute("placeholder")?.toLowerCase() || "";
            const id = input.id?.toLowerCase() || "";
            const searchText = label.toLowerCase();
            return ariaLabel.includes(searchText) || placeholder.includes(searchText) || id.includes(searchText);
          });
        
        if (!el) return { ok: false, error: "not_found" };
        if (!isElementVisible(el)) return { ok: false, error: "not_visible" };
        
        el.focus();
        el.value = "";
        
        for (let i = 0; i < text.length; i++) {
          el.value += text[i];
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          await sleep(charDelay);
        }
        
        const rect = el.getBoundingClientRect();
        return { ok: true, position: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }, typedLength: text.length };
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
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  if (document.readyState === "complete") {
    sendReady();
  } else {
    window.addEventListener("load", sendReady);
  }
  
  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(sendReady, 500);
    }
  }, 500);
})();
