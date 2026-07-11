import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/context/ThemeContext";
import { ConfirmProvider } from "@/context/ConfirmContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ConfirmProvider>
        <Component {...pageProps} />
      </ConfirmProvider>
    </ThemeProvider>
  );
}
