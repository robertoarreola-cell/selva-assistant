(function() {
  // URL de tu app deployada en Vercel
  const CHAT_APP_URL = 'https://selva-assistant-git-main-robertos-projects-eee4cbcb.vercel.app';
  
  // Crear botón flotante con tu logo
  const chatButton = document.createElement('div');
  chatButton.id = 'selva-chat-button';
  chatButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #2E7D32, #66BB6A);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: all 0.3s ease;
    border: 3px solid rgba(255, 255, 255, 0.2);
  `;

  // Crear imagen con tu logo SVG
  const logoImg = document.createElement('img');
  logoImg.src = `${CHAT_APP_URL}/chat-icon.svg`;
  logoImg.alt = 'Selva Chat';
  logoImg.style.cssText = `
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  `;
  
  chatButton.appendChild(logoImg);

  // Crear iframe del chat
  const chatIframe = document.createElement('iframe');
  chatIframe.id = 'selva-chat-iframe';
  chatIframe.src = CHAT_APP_URL;
  chatIframe.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 360px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    z-index: 9998;
    display: none;
    background: white;
  `;

  // Toggle del chat
  chatButton.addEventListener('click', function() {
    if (chatIframe.style.display === 'none') {
      chatIframe.style.display = 'block';
    } else {
      chatIframe.style.display = 'none';
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

  // Agregar al DOM
  document.body.appendChild(chatButton);
  document.body.appendChild(chatIframe);
})();