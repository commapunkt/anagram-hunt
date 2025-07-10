import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface AnimatedLogoProps {
  style?: any;
  onLoad?: () => void;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ style, onLoad }) => {
  // HTML content for the animated logo
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CommaPunkt Games - Concept Nébuleuse</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400&display=swap" rel="stylesheet">
        <style>
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background-color: #000005;
                color: #E5E7EB;
                font-family: 'Exo 2', sans-serif;
            }
            canvas {
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
            }
            .content-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                pointer-events: none;
                background: radial-gradient(circle, rgba(0,0,5,0) 0%, rgba(0,0,5,0.8) 70%);
            }
            .title {
                font-family: 'Orbitron', sans-serif;
                font-weight: 900;
                font-size: clamp(2rem, 10vw, 5rem);
                text-transform: uppercase;
                color: #fff;
                letter-spacing: 0.1em;
                text-shadow:
                    0 0 10px #fff,
                    0 0 20px #fff,
                    0 0 30px #A855F7,
                    0 0 40px #A855F7,
                    0 0 50px #A855F7,
                    0 0 60px #A855F7,
                    0 0 70px #A855F7;
                animation: flicker 3s infinite alternate;
            }
            .subtitle {
                font-size: clamp(1rem, 4vw, 1.5rem);
                text-transform: uppercase;
                letter-spacing: 0.4em;
                color: #D1D5DB;
                margin-top: 1rem;
                text-shadow: 0 0 10px #A855F7;
            }
            .description {
                position: absolute;
                bottom: 5%;
                left: 50%;
                transform: translateX(-50%);
                max-width: 600px;
                font-size: 0.9rem;
                color: #9CA3AF;
                background: rgba(0,0,5,0.5);
                padding: 1rem;
                border-radius: 8px;
                backdrop-filter: blur(5px);
            }

            @keyframes flicker {
                0%, 18%, 22%, 25%, 53%, 57%, 100% {
                    text-shadow:
                        0 0 4px #fff,
                        0 0 11px #fff,
                        0 0 19px #fff,
                        0 0 40px #A855F7,
                        0 0 80px #A855F7,
                        0 0 90px #A855F7,
                        0 0 100px #A855F7,
                        0 0 150px #A855F7;
                }
                20%, 24%, 55% {        
                    text-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <canvas id="logo-canvas"></canvas>
        <div class="content-overlay">
            <div>
                <h1 class="title">Comma<br>Punkt</h1>
                <h2 class="subtitle">Games</h2>
            </div>
        </div>

        <script>
            const canvas = document.getElementById('logo-canvas');
            const ctx = canvas.getContext('2d');
            let particles = [];
            let mouse = { x: null, y: null };

            function resizeCanvas() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            window.addEventListener('resize', resizeCanvas);
            window.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
            
            class Particle {
                constructor(x, y, radius, color, velocity) {
                    this.x = x;
                    this.y = y;
                    this.radius = radius;
                    this.color = color;
                    this.velocity = velocity;
                    this.opacity = 1;
                    this.angle = Math.random() * Math.PI * 2;
                    this.distanceFromCenter = {
                        x: Math.random() * (canvas.width / 4 - 50) + 50,
                        y: Math.random() * (canvas.height / 4 - 50) + 50,
                    };
                }

                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    ctx.restore();
                    ctx.closePath();
                }

                update() {
                    this.angle += this.velocity;
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    
                    this.x = centerX + Math.cos(this.angle) * this.distanceFromCenter.x;
                    this.y = centerY + Math.sin(this.angle) * this.distanceFromCenter.y * 0.6;

                    if (mouse.x && mouse.y) {
                        const dx = mouse.x - this.x;
                        const dy = mouse.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < 100) {
                            this.x -= dx / 15;
                            this.y -= dy / 15;
                        }
                    }

                    this.draw();
                }
            }

            function init() {
                particles = [];
                const particleCount = 300;
                const colors = ['#A855F7', '#EC4899', '#F472B6', '#FDE047', '#FFFFFF'];
                for (let i = 0; i < particleCount; i++) {
                    const radius = Math.random() * 1.5 + 0.5;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const velocity = Math.random() * 0.005 + 0.001;
                    particles.push(new Particle(0, 0, radius, color, velocity));
                }
            }
            
            function drawCore() {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const pulse = Math.abs(Math.sin(Date.now() * 0.0005));

                const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40 + pulse * 15);
                glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                glowGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
                glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
                ctx.fillStyle = glowGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15 + pulse * 5);
                coreGradient.addColorStop(0, '#FFFFFF');
                coreGradient.addColorStop(0.8, '#FDE047');
                coreGradient.addColorStop(1, '#EC4899');
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, 15 + pulse * 5, 0, Math.PI * 2);
                ctx.fillStyle = coreGradient;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 30;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            function animate() {
                requestAnimationFrame(animate);
                ctx.fillStyle = 'rgba(0, 0, 5, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                particles.forEach(p => p.update());
                drawCore();
            }

            resizeCanvas();
            init();
            animate();
        </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    // For web, use an iframe
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent'
          }}
          onLoad={onLoad}
        />
      </View>
    );
  } else {
    // For mobile, use WebView
    return (
      <View style={[styles.container, style]}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          onLoad={onLoad}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000005',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default AnimatedLogo; 