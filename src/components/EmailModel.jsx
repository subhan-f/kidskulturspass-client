// import React from 'react';
// import { Modal } from 'react-bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

// const EmailModal = ({ email, onClose }) => {
//   if (!email) return null;

//   const formatDate = (dateInput) => {
//     if (typeof dateInput === 'string') {
//       try {
//         const date = new Date(dateInput);
//         if (isNaN(date.getTime())) {
//           return 'N/A';
//         }
//         return date.toLocaleString();
//       } catch (e) {
//         return 'N/A';
//       }
//     }
    
//     if (dateInput && dateInput.$date && dateInput.$date.$numberLong) {
//       try {
//         const timestamp = dateInput.$date.$numberLong;
//         const date = new Date(parseInt(timestamp));
//         if (isNaN(date.getTime())) {
//           return 'N/A';
//         }
//         return date.toLocaleString();
//       } catch (e) {
//         return 'N/A';
//       }
//     }
    
//     if (dateInput instanceof Date) {
//       if (isNaN(dateInput.getTime())) {
//         return 'N/A';
//       }
//       return dateInput.toLocaleString();
//     }
    
//     return 'N/A';
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'Delivered':
//         return 'bg-success';
//       case 'Pending':
//         return 'bg-warning text-dark';
//       case 'Failed':
//         return 'bg-danger';
//       case 'Opened':
//         return 'bg-primary';
//       case 'Sent':
//         return 'bg-info text-dark';
//       default:
//         return 'bg-secondary';
//     }
//   };

//   return (
//     <Modal show={!!email} onHide={onClose} size="lg" centered>
//       <Modal.Header closeButton className="border-bottom-0">
//         <Modal.Title className="fw-bold text-primary">Email Details</Modal.Title>
//       </Modal.Header>
//       <Modal.Body className="pt-0">
//         <div className="row mb-3">
//           <div className="col-md-6">
//             <div className="mb-2">
//               <h6 className="text-muted small mb-1">Recipient</h6>
//               <p className="mb-0">{email.email}</p>
//             </div>
//           </div>
//           <div className="col-md-6">
//             <div className="mb-2">
//               <h6 className="text-muted small mb-1">Status</h6>
//               <span className={`badge ${getStatusColor(email.status)} rounded-pill`}>
//                 {email.status}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="row mb-3">
//           <div className="col-md-6">
//             <div className="mb-2">
//               <h6 className="text-muted small mb-1">Subject</h6>
//               <p className="mb-0">{email.subject}</p>
//             </div>
//           </div>
//           <div className="col-md-6">
//             <div className="mb-2">
//               <h6 className="text-muted small mb-1">Sent At</h6>
//               <p className="mb-0">{formatDate(email.date)}</p>
//             </div>
//           </div>
//         </div>

//         <div className="mb-3">
//           <h6 className="text-muted small mb-1">Type</h6>
//           <p className="mb-0">{email.type}</p>
//         </div>

//         {(email.content || email.htmlContent) && (
//           <div className="mt-4">
//             <h5 className="fw-bold mb-3 text-primary">Email Content</h5>
//             <div 
//               className="email-content-preview p-3 bg-light rounded border" 
//               style={{ maxHeight: '400px', overflowY: 'auto' }}
//             >
//               {email.htmlContent ? (
//                 <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
//               ) : (
//                 <div dangerouslySetInnerHTML={{ __html: email.content }} />
//               )}
//             </div>
//           </div>
//         )}
//       </Modal.Body>
//       <Modal.Footer className="border-top-0">
//         <button className="btn btn-outline-secondary" onClick={onClose}>
//           Close
//         </button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default EmailModal;
import React from 'react';
import { Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const EmailModal = ({ email, onClose }) => {
  if (!email) return null;

  const formatDate = (dateInput) => {
    if (typeof dateInput === 'string') {
      try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        return 'N/A';
      }
    }
    
    if (dateInput && dateInput.$date && dateInput.$date.$numberLong) {
      try {
        const timestamp = dateInput.$date.$numberLong;
        const date = new Date(parseInt(timestamp));
        if (isNaN(date.getTime())) {
          return 'N/A';
        }
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        return 'N/A';
      }
    }
    
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return 'N/A';
      }
      return dateInput.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    return 'N/A';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'status-delivered';
      case 'Pending':
        return 'status-pending';
      case 'Failed':
        return 'status-failed';
      case 'Opened':
        return 'status-opened';
      case 'Sent':
        return 'status-sent';
      default:
        return 'status-default';
    }
  };

  return (
    <Modal show={!!email} onHide={onClose} size="lg" centered className="email-modal">
      <Modal.Header closeButton className="email-modal-header">
        <Modal.Title className="email-modal-title">
          <i className="bi bi-envelope-fill me-2"></i>
          Email Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="email-modal-body">
        <div className="email-details-grid">
          <div className="email-detail">
            <label className="email-detail-label">Recipient</label>
            <p className="email-detail-value">{email.email || 'N/A'}</p>
          </div>
          
          <div className="email-detail">
            <label className="email-detail-label">Status</label>
            <span className={`email-status ${getStatusColor(email.status)}`}>
              {email.status || 'N/A'}
            </span>
          </div>
          
          <div className="email-detail">
            <label className="email-detail-label">Subject</label>
            <p className="email-detail-value">{email.subject || 'N/A'}</p>
          </div>
          
          <div className="email-detail">
            <label className="email-detail-label">Sent At</label>
            <p className="email-detail-value">{formatDate(email.date)}</p>
          </div>
          
          <div className="email-detail">
            <label className="email-detail-label">Type</label>
            <p className="email-detail-value">{email.type || 'N/A'}</p>
          </div>
        </div>

        {(email.content || email.htmlContent) && (
          <div className="email-content-section">
            <h3 className="email-content-title">
              <i className="bi bi-card-text me-2"></i>
              Email Content
            </h3>
            <div className="email-content-preview">
              {email.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: email.content }} />
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="email-modal-footer">
        <button className="email-modal-close-btn" onClick={onClose}>
          <i className="bi bi-x-lg me-1"></i>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmailModal;