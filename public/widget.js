(function() {
  'use strict';
  
  // Verificar si ya existe
  if (document.getElementById('selva-chat-button')) return;
  
  // URL de tu app deployada en Vercel
  const CHAT_APP_URL = 'https://selva-assistant-git-main-robertos-projects-eee4cbcb.vercel.app';
  
  // Función para crear el widget de forma segura
  function createWidget() {
    try {
      // Crear botón flotante con tu logo
      const chatButton = document.createElement('div');
      chatButton.id = 'selva-chat-button';
      chatButton.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 200px !important;
        width: 70px !important;
        height: 70px !important;
        background: linear-gradient(135deg, #2E7D32, #66BB6A) !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        transition: all 0.3s ease !important;
        border: 3px solid rgba(255, 255, 255, 0.2) !important;
      `;

      // SVG inline personalizado (reemplaza con tu SVG)
      chatButton.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          <circle cx="8" cy="10" r="1"/>
          <circle cx="12" cy="10" r="1"/>
          <circle cx="16" cy="10" r="1"/>
        </svg>
      `;

      // Variable para el iframe
      let chatIframe = null;

      // Toggle del chat
      chatButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!chatIframe) {
          // Crear iframe solo cuando se necesite
          chatIframe = document.createElement('iframe');
          chatIframe.id = 'selva-chat-iframe';
          chatIframe.src = CHAT_APP_URL;
          chatIframe.style.cssText = `
            position: fixed !important;
            bottom: 100px !important;
            right: 20px !important;
            width: 380px !important;
            height: 650px !important;
            border: none !important;
            border-radius: 12px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.35) !important;
            z-index: 1000000 !important;
            display: block !important;
            background: white !important;
          `;
          document.body.appendChild(chatIframe);
        } else {
          // Toggle visibility
          if (chatIframe.style.display === 'none') {
            chatIframe.style.display = 'block';
          } else {
            chatIframe.style.display = 'none';
          }
        }
      });

      // Efectos hover
      chatButton.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 12px 35px rgba(46, 125, 50, 0.6)';
      });

      chatButton.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 8px 25px rgba(46, 125, 50, 0.4)';
      });

      // Agregar al DOM de forma segura
      if (document.body) {
        document.body.appendChild(chatButton);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          document.body.appendChild(chatButton);
        });
      }
      
    } catch (error) {
      console.log('Selva widget error:', error);
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

})();