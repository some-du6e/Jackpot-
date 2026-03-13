// Jackpot+ — Inline styles injection
console.log("Jackpot+: styles module loaded.")

function injectStyles() {
  const style = document.createElement("style")
  style.textContent = `
    /* Strip the roses background — target every likely container */
    html,
    body,
    body.deck-body,
    .deck-page,
    .deck-page::before,
    .deck-page::after,
    body::before,
    body::after {
      background-image: none !important;
      background: #f8fafc !important;
    }
    
    /* Toolbar — solid, confident, no glassmorphism, no shadow */
    .toolbar {
      background: #fff !important;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: none !important;
    }
    
    .toolbar-content {
      max-width: 1200px;
      margin: 0 auto;
      box-shadow: none !important;
    }
    
    /* Nav items — subtle, no bounce */
    .nav-item {
      transition: color 0.15s ease;
      border-radius: 8px;
      padding: 6px 12px;
    }
    
    .nav-active {
      position: relative;
    }
    
    .nav-active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      background: #0f172a;
      border-radius: 2px;
    }
    
    /* Avatar chip — no bounce */
    .avatar-chip {
      transition: opacity 0.15s ease;
    }
    
    .avatar-chip-btn:hover .avatar-chip {
      opacity: 0.85;
    }
    
    /* Toolbar stats — solid tints, no gradients, no bounce */
    .jp-toolbar-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 12px;
      opacity: 0;
      animation: jp-stats-fade-in 0.3s ease forwards;
    }
    
    @keyframes jp-stats-fade-in {
      to { opacity: 1; }
    }
    
    .jp-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: default;
      user-select: none;
      border: 1px solid transparent;
    }
    
    .jp-stat-label {
      color: #64748b;
      font-weight: 500;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    
    .jp-stat-value {
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
    
    .jp-chips-stat {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    
    .jp-hours-stat {
      background: #eff6ff;
      color: #1e40af;
      border-color: #dbeafe;
    }

    /* Subtle pulse when value updates */
    .jp-stat-updated {
      animation: jp-stat-pulse 0.6s ease-out;
    }

    @keyframes jp-stat-pulse {
      0% { transform: scale(1); }
      40% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
  `
  document.head.appendChild(style)

  console.log("Jackpot+: styles injected")
}
