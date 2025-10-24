(function() {
  'use strict';
  
  // Verificar si ya existe
  if (document.getElementById('selva-chat-button')) return;
  
  // URL de tu app deployada en Vercel - usar página principal
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

      // Crear imagen con tu logo SVG real
      const logoImg = document.createElement('img');
      logoImg.src = 'https://selva-assistant-git-main-robertos-projects-eee4cbcb.vercel.app/chat-icon.svg';
      logoImg.alt = 'Selva Chat';
      logoImg.style.cssText = `
        width: 40px !important;
        height: 40px !important;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)) !important;
        pointer-events: none !important;
      `;
      
      // Fallback si no carga la imagen
      logoImg.onerror = function() {
        chatButton.innerHTML = `
          <div style="color: white; font-weight: bold; font-size: 10px; text-align: center; line-height: 1.2;">
            🌿<br>SELVA
          </div>
        `;
      };
      
      chatButton.appendChild(logoImg);

      // Toggle del chat - ABRIR PÁGINA PRINCIPAL EN VENTANA PEQUEÑA
      chatButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Abrir página principal en ventana compacta
        window.open(CHAT_APP_URL, 'selva-chat', 'width=400,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no');
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