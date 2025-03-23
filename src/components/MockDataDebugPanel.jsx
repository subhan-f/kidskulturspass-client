import React, { useState, useEffect } from 'react';
import { Card, Button, Accordion } from 'react-bootstrap';
import { Bug, ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { mockHistoryData } from '../utils/mockData';

/**
 * A debug panel to display mock data during development
 * Only displays in development mode
 */
const MockDataDebugPanel = ({ dataType = 'history' }) => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState(null);
  
  // Load appropriate mock data based on type
  useEffect(() => {
    if (dataType === 'history') {
      setData(mockHistoryData);
      console.log("Debug panel loaded mock data:", mockHistoryData);
    }
  }, [dataType]);
  
  // Only show in development mode
  if (!data) {
    console.log("Mock data is not available");
    return null;
  }

  return (
    <div className="mock-data-debug-panel mt-4 mb-4">
      <Card className="border-warning">
        <Card.Header 
          className="bg-warning bg-opacity-10 d-flex justify-content-between align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="d-flex align-items-center">
            <Bug className="me-2" />
            <span className="fw-bold">Mock Data Viewer (Development Only)</span>
          </div>
          <Button 
            variant="link" 
            className="p-0 text-dark"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </Card.Header>
        
        {expanded && (
          <Card.Body className="bg-light">
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>History Data (7-day period)</Accordion.Header>
                <Accordion.Body>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped table-bordered">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Total Count</th>
                          <th>Klavier</th>
                          <th>Geigen</th>
                          <th>Weihnachts</th>
                          <th>Nikolaus</th>
                          <th>Laternenumzug</th>
                          <th>Puppentheater</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.history && data.history.slice(0, 7).map((entry, index) => (
                          <tr key={index}>
                            <td>{entry.date}</td>
                            <td>{entry.count}</td>
                            <td>{entry.klavier_count}</td>
                            <td>{entry.geigen_count}</td>
                            <td>{entry.weihnachts_count}</td>
                            <td>{entry.nikolaus_count}</td>
                            <td>{entry.laternenumzug_count}</td>
                            <td>{entry.puppentheater_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
              
              {data.analysis && (
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Analysis Data</Accordion.Header>
                  <Accordion.Body>
                    <div className="row">
                      {Object.entries(data.analysis).map(([key, value], index) => (
                        <div className="col-md-6 mb-2" key={index}>
                          <div className="card">
                            <div className="card-body py-2 px-3">
                              <strong>{key.replace(/_/g, ' ')}:</strong> {value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              )}
              
              <Accordion.Item eventKey="2">
                <Accordion.Header>Raw JSON Data</Accordion.Header>
                <Accordion.Body>
                  <pre className="bg-dark text-light p-3 rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default MockDataDebugPanel;
