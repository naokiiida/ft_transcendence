import { define } from "../utils.ts";
import "../assets/styles.css";

export default define.page(function App({ Component }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ft_transcendence</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body class="min-h-screen bg-base-100">
        <Component />
      </body>
    </html>
  );
});
