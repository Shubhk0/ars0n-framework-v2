import React from 'react';
import { Modal, Button, Badge, Accordion } from 'react-bootstrap';

export const AmassEnumCompanyHistoryModal = ({ 
  show, 
  handleClose, 
  scans 
}) => {
  const getCloudDomainCount = (scan) => {
    if (!scan?.result) return 0;
    try {
      const parsed = JSON.parse(scan.result);
      return parsed.summary?.total_cloud_domains || parsed.cloud_domains?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  const getScannedDomainsCount = (scan) => {
    if (!scan?.domains) return 0;
    try {
      return Array.isArray(scan.domains) ? scan.domains.length : JSON.parse(scan.domains).length;
    } catch (error) {
      return 0;
    }
  };

  const getScannedDomains = (scan) => {
    if (!scan?.domains) return [];
    try {
      return Array.isArray(scan.domains) ? scan.domains : JSON.parse(scan.domains);
    } catch (error) {
      return [];
    }
  };

  const getProviderBreakdown = (scan) => {
    if (!scan?.result) return { aws: 0, gcp: 0, azure: 0, other: 0 };
    try {
      const parsed = JSON.parse(scan.result);
      return {
        aws: parsed.summary?.aws_domains || 0,
        gcp: parsed.summary?.gcp_domains || 0,
        azure: parsed.summary?.azure_domains || 0,
        other: parsed.summary?.other_domains || 0
      };
    } catch (error) {
      return { aws: 0, gcp: 0, azure: 0, other: 0 };
    }
  };

  const renderProviderBadges = (scan) => {
    const breakdown = getProviderBreakdown(scan);
    return (
      <div className="d-flex gap-1 flex-wrap">
        {breakdown.aws > 0 && <Badge bg="warning" title="AWS">{breakdown.aws}</Badge>}
        {breakdown.gcp > 0 && <Badge bg="info" title="GCP">{breakdown.gcp}</Badge>}
        {breakdown.azure > 0 && <Badge bg="primary" title="Azure">{breakdown.azure}</Badge>}
        {breakdown.other > 0 && <Badge bg="secondary" title="Other">{breakdown.other}</Badge>}
      </div>
    );
  };

  return (
    <Modal 
      data-bs-theme="dark" 
      show={show} 
      onHide={handleClose} 
      size="xl"
    >
      <Modal.Header closeButton>
        <Modal.Title className='text-danger'>Amass Enum Company Scan History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {scans && scans.length > 0 ? (
          <Accordion data-bs-theme="dark">
            {scans.map((scan, index) => (
              <Accordion.Item eventKey={index.toString()} key={scan.scan_id} className="bg-dark border-secondary">
                <Accordion.Header className="bg-dark">
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex align-items-center w-75">
                      <div className="me-4">
                        <Badge className={`${
                          scan.status === 'success' ? 'bg-success' : 
                          scan.status === 'error' ? 'bg-danger' : 
                          'bg-warning'
                        }`}>
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="me-4">
                        <span className="text-white">
                          <strong>{getScannedDomainsCount(scan)}</strong> domains scanned
                        </span>
                      </div>
                      <div className="me-4">
                        <span className="text-white">
                          <strong>{getCloudDomainCount(scan)}</strong> cloud domains found
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-white-50 small">
                        {scan.created_at ? new Date(scan.created_at).toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-white-50 small" style={{ fontFamily: 'monospace' }}>
                        {scan.execution_time || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="bg-dark">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-white mb-3">Root Domains Scanned</h6>
                      <div className="bg-black p-3 rounded border border-secondary">
                        {getScannedDomains(scan).length > 0 ? (
                          <ul className="list-unstyled mb-0">
                            {getScannedDomains(scan).map((domain, domainIndex) => (
                              <li key={domainIndex} className="text-white font-monospace mb-1">
                                • {domain}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-white-50">No domain information available</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-white mb-3">Scan Details</h6>
                      <div className="bg-black p-3 rounded border border-secondary">
                        <div className="text-white mb-2">
                          <strong>Scan ID:</strong>
                          <div className="font-monospace text-white-50 small">{scan.scan_id || 'N/A'}</div>
                        </div>
                        <div className="text-white mb-2">
                          <strong>Started:</strong>
                          <div className="text-white-50 small">{scan.created_at ? new Date(scan.created_at).toLocaleString() : 'N/A'}</div>
                        </div>
                        <div className="text-white mb-2">
                          <strong>Execution Time:</strong>
                          <div className="text-white-50 small">{scan.execution_time || 'N/A'}</div>
                        </div>
                        <div className="text-white">
                          <strong>Status:</strong>
                          <div className="mt-1">
                            <Badge className={`${
                              scan.status === 'success' ? 'bg-success' : 
                              scan.status === 'error' ? 'bg-danger' : 
                              'bg-warning'
                            }`}>
                              {scan.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-white-50 py-4">
            <i className="bi bi-clock-history" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">No scan history available</p>
            <small>Run an Amass Enum Company scan to see results here.</small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}; 