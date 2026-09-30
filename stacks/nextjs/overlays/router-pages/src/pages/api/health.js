export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    stack: 'Next.js {{VERSION}} Pages Router',
    database: '{{DB_TYPE}}',
    appName: {{APP_TITLE_JS}}
  });
}
