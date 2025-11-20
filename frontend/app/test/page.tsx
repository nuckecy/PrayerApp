export default function TestPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>✅ Vercel Deployment Test - SUCCESS!</h1>
      <p>If you can see this page, Vercel is correctly serving files from the frontend directory.</p>
      <ul>
        <li>Root Directory: frontend ✅</li>
        <li>Build Command: npm run build ✅</li>
        <li>Next.js App Router: Working ✅</li>
      </ul>
      <hr />
      <p><a href="/">← Back to Home</a></p>
    </div>
  );
}
