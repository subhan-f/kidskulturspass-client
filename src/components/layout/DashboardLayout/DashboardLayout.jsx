import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { NetworkStatusIndicator } from '../../common';

/**
 * Shared layout for all dashboard pages
 */
function DashboardLayout({ 
  setAuth, 
  onRefresh,
  handleLogout,
  children, 
  containerClass = 'container',
  pageTitle
}) {
  return (
    <div className="dashboard-page">
      <Header setAuth={setAuth} onRefresh={onRefresh} handleLogout={handleLogout}/>
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
