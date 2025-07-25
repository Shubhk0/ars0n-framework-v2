const monitorKatanaCompanyScanStatus = async (
  scanId, 
  setIsKatanaCompanyScanning, 
  setKatanaCompanyScans, 
  setMostRecentKatanaCompanyScan, 
  setMostRecentKatanaCompanyScanStatus,
  setKatanaCompanyCloudAssets = null,
  activeTarget = null
) => {
  let attempts = 0;
  const maxAttempts = 600; // 10 minutes with 1-second intervals
  
  const poll = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/katana-company/status/${scanId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch scan status');
      }
      
      const scanStatus = await response.json();
      setMostRecentKatanaCompanyScan(scanStatus);
      setMostRecentKatanaCompanyScanStatus(scanStatus.status);
      
      // Update scans list
      if (setKatanaCompanyScans) {
        setKatanaCompanyScans(prevScans => {
          const updatedScans = prevScans.map(scan => 
            scan.scan_id === scanId ? scanStatus : scan
          );
          
          // If scan not found in list, add it
          if (!updatedScans.find(scan => scan.scan_id === scanId)) {
            updatedScans.unshift(scanStatus);
          }
          
          return updatedScans;
        });
      }
      
      if (scanStatus.status === 'success') {
        setIsKatanaCompanyScanning(false);
        
        // Fetch accumulated cloud assets from the backend API
        if (setKatanaCompanyCloudAssets) {
          try {
            const assetsResponse = await fetch(
              `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/katana-company/${scanId}/cloud-assets`
            );
            if (assetsResponse.ok) {
              const assets = await assetsResponse.json();
              setKatanaCompanyCloudAssets(assets || []);
            } else {
              console.error('Failed to fetch cloud assets');
              setKatanaCompanyCloudAssets([]);
            }
          } catch (error) {
            console.error('Error fetching cloud assets:', error);
            setKatanaCompanyCloudAssets([]);
          }
        }
        
        // Refresh the complete scan list when scan completes to ensure UI consistency
        if (activeTarget && setKatanaCompanyScans) {
          try {
            const refreshResponse = await fetch(
              `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/scopetarget/${activeTarget.id}/scans/katana-company`
            );
            if (refreshResponse.ok) {
              const refreshedScans = await refreshResponse.json();
              if (Array.isArray(refreshedScans)) {
                setKatanaCompanyScans(refreshedScans);
                // Update the most recent scan from the refreshed data
                if (refreshedScans.length > 0) {
                  const mostRecentScan = refreshedScans.reduce((latest, scan) => {
                    const scanDate = new Date(scan.created_at);
                    return scanDate > new Date(latest.created_at) ? scan : latest;
                  }, refreshedScans[0]);
                  setMostRecentKatanaCompanyScan(mostRecentScan);
                  setMostRecentKatanaCompanyScanStatus(mostRecentScan.status);
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing scan list:', error);
          }
        }
        
        return scanStatus;
      } else if (scanStatus.status === 'failed' || scanStatus.status === 'error') {
        setIsKatanaCompanyScanning(false);
        console.error('Katana Company scan failed:', scanStatus.error);
        return scanStatus;
      } else if (scanStatus.status === 'pending' || scanStatus.status === 'running') {
        attempts++;
        
        if (attempts >= maxAttempts) {
          console.error('Katana Company scan monitoring timed out');
          setIsKatanaCompanyScanning(false);
          return scanStatus;
        }
        
        // Continue polling
        setTimeout(poll, 1000);
      }
    } catch (error) {
      console.error('Error monitoring Katana Company scan:', error);
      attempts++;
      
      if (attempts >= maxAttempts) {
        console.error('Katana Company scan monitoring failed after maximum attempts');
        setIsKatanaCompanyScanning(false);
        return null;
      }
      
      // Retry after error
      setTimeout(poll, 2000);
    }
  };
  
  // Start polling immediately
  poll();
};

export default monitorKatanaCompanyScanStatus; 