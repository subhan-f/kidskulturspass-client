import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NetworkStatusIndicator from './NetworkStatusIndicator';

/**
 * Shared layout for all dashboard pages
 */
function DashboardLayout({ 
  setAuth, 
  onRefresh, 
  children, 
  containerClass = 'container',
  pageTitle
}) {
  return (
    <div className="dashboard-page">
      <Navbar setAuth={setAuth} onRefresh={onRefresh} />
      <NetworkStatusIndicator />
      
      <div className={`content-wrapper ${containerClass}`}>
        {pageTitle && (
          <h1 className="page-title">{pageTitle}</h1>
        )}
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default DashboardLayout;
