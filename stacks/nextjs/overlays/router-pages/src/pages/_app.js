import '@/styles/globals.css';
import '@/styles/theme.css';
{{PAGES_VENDOR_CSS}}

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
