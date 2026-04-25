import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>BikriTracker | AI-Powered Indian Grocery Sales Prediction</title>
        <meta name="description" content="Predict sales and manage inventory for your Indian grocery store using AI." />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Navigation */}
        <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36">
              <rect width="32" height="32" rx="8" fill="var(--primary-light)"/>
              <path d="M5 22l5-10 6 5 5-10 6 11" stroke="var(--primary)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', letterSpacing: '-0.5px' }}>BikriTracker</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/login">
              <button className="btn" style={{ backgroundColor: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Log In</button>
            </Link>
            <Link href="/dashboard">
              <button className="btn btn-primary" style={{ boxShadow: '0 4px 14px rgba(109, 129, 150, 0.4)' }}>Get Started</button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', width: '100%' }}>
            
            <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-darker)', borderRadius: '999px', fontSize: '14px', fontWeight: '600', marginBottom: '24px', border: '1px solid var(--primary-muted)' }}>
              ✨ The future of grocery management
            </div>

            <h1 style={{ fontSize: '56px', fontWeight: '800', color: 'var(--text)', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-1.5px' }}>
              Predict Sales. <span style={{ color: 'var(--primary)' }}>Optimize Inventory.</span> Grow Your Store.
            </h1>
            
            <p style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
              BikriTracker uses powerful AI to forecast demand for Indian grocery products. Stop guessing what to stock and start making data-driven decisions.
            </p>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <Link href="/dashboard">
                <button className="btn btn-primary" style={{ fontSize: '18px', padding: '14px 32px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(109, 129, 150, 0.3)' }}>
                  Get Started for Free
                </button>
              </Link>
              <Link href="#features">
                <button className="btn" style={{ fontSize: '18px', padding: '14px 32px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  See How It Works
                </button>
              </Link>
            </div>
            
          </div>
        </main>
        
        {/* Features Section */}
        <section id="features" style={{ padding: '80px 48px', backgroundColor: 'var(--card-bg)' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              
              <div style={{ padding: '32px', backgroundColor: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                 </div>
                 <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Smart Predictions</h3>
                 <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Upload your past sales data and let our machine learning models forecast demand for the upcoming weeks.</p>
              </div>

              <div style={{ padding: '32px', backgroundColor: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                 </div>
                 <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Inventory Tracking</h3>
                 <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Keep a detailed log of your best-selling items, from beverages and snacks to oil & masala.</p>
              </div>

              <div style={{ padding: '32px', backgroundColor: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="2"/>
                      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="2"/>
                      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="2"/>
                      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="var(--primary)" strokeWidth="2"/>
                    </svg>
                 </div>
                 <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Actionable Insights</h3>
                 <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Visualize your sales trends and prediction accuracy with our easy-to-understand dashboard.</p>
              </div>

           </div>
        </section>

      </div>
    </>
  );
}
