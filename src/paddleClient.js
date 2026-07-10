let paddleReady = null;

export function loadPaddle(onEvent) {
  if (paddleReady) return paddleReady;

  paddleReady = new Promise((resolve, reject) => {
    if (window.Paddle) {
      resolve(window.Paddle);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const env = import.meta.env.VITE_PADDLE_ENV || "sandbox";
      if (env === "sandbox") window.Paddle.Environment.set("sandbox");
      window.Paddle.Initialize({
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        eventCallback: (event) => onEvent && onEvent(event),
      });
      resolve(window.Paddle);
    };
    script.onerror = () => reject(new Error("No se pudo cargar Paddle.js"));
    document.head.appendChild(script);
  });

  return paddleReady;
}

export const PADDLE_PRICE_IDS = {
  mensual: import.meta.env.VITE_PADDLE_PRICE_MENSUAL,
  anual: import.meta.env.VITE_PADDLE_PRICE_ANUAL,
  chef_mensual: import.meta.env.VITE_PADDLE_PRICE_CHEF_MENSUAL,
  chef_anual: import.meta.env.VITE_PADDLE_PRICE_CHEF_ANUAL,
};
