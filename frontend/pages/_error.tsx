/**
 * Custom Error Page (Pages Router compatibility)
 * Required for Next.js to generate 500.html during build.
 */
import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0A0A0B',
      color: '#a1a1aa',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>
        {statusCode || 'Error'}
      </h1>
      <p>{statusCode === 404 ? 'Page not found.' : 'An unexpected error occurred.'}</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
