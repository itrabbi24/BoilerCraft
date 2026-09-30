import './globals.css';
import '../styles/theme.css';
import '../styles/vendor.js';

export const metadata = {
  title: {{APP_TITLE_JS}},
  description: {{APP_DESC_JS}}
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="{{COLOR_MODE}}">
      <body>{children}</body>
    </html>
  );
}
