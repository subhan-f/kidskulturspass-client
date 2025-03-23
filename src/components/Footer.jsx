import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer mt-auto py-3">
      <div className="container d-flex justify-content-center">
        <span className="text-muted">
          &copy; {currentYear} KidsKulturSpass Dashboard
        </span>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
