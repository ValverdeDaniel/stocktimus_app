import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';
import WatchlistContractCard from './WatchlistContractCard';
import apiClient, {
  refreshGroupContracts,
  getJobStatus,
} from '../services/api';

function WatchlistGroups({
  groups,
  onRunGroup,
  fetchGroups,
  selectedContracts,
  setSelectedContracts,
  handleRunSelected,
  handleBulkDelete,
  handleBulkAssign,
}) {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [contractsForAssignment, setContractsForAssignment] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [refreshingGroups, setRefreshingGroups] = useState({});
  const [refreshJobs, setRefreshJobs] = useState({});

  // --- Toggle Collapse ---
  const toggleCollapse = (groupId) => {
    console.group(`📂 Toggling Group Collapse - Group ID: ${groupId}`);
    console.log('Before:', collapsedGroups);
    setCollapsedGroups((prev) => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      console.log('After:', updated);
      console.groupEnd();
      return updated;
    });
  };

  // --- Open Assign Modal ---
  const openAssignModalForContracts = (contracts) => {
    console.group('🔗 Opening Assign Modal');
    console.log('Contracts to assign:', contracts);
    console.groupEnd();
    setContractsForAssignment(contracts);
    setAssignModalVisible(true);
  };

  // --- Reset Days ---
  const handleResetDays = async (contractId) => {
    console.group(`⏳ Resetting Countdown - Contract ID: ${contractId}`);
    try {
      await apiClient.patch(`/saved-contracts/${contractId}/reset-days/`);
      console.log(`✅ Countdown reset for contract ID: ${contractId}`);
      await fetchGroups();
    } catch (err) {
      console.error(`❌ Error resetting countdown for contract ID ${contractId}:`, err);
      alert("Failed to reset countdown.");
    }
    console.groupEnd();
  };

  // --- Refresh Contract ---
  const handleRefresh = async (contractId) => {
    console.group(`🔄 Refreshing Contract - Contract ID: ${contractId}`);
    try {
      await apiClient.patch(`/saved-contracts/${contractId}/refresh/`);
      console.log(`✅ Data refreshed for contract ID: ${contractId}`);
      await fetchGroups();
    } catch (err) {
      console.error(`❌ Error refreshing contract ID ${contractId}:`, err);
      alert("Failed to refresh contract data.");
    }
    console.groupEnd();
  };

  // --- Delete Contract ---
  const handleDeleteContract = async (contractId, groupId) => {
    console.group(`🗑 Deleting Contract - Contract ID: ${contractId}, Group ID: ${groupId}`);
    try {
      await apiClient.delete(`/watchlist-groups/${groupId}/contracts/${contractId}/`);
      console.log(`✅ Successfully removed contract ID: ${contractId} from group ID: ${groupId}`);
      await fetchGroups();
    } catch (err) {
      console.error(`❌ Error removing contract ${contractId} from group ${groupId}:`, err);
      alert("Failed to remove contract from group.");
    }
    console.groupEnd();
  };

  // --- Run Group Simulation ---
  const handleRunGroup = async (groupId) => {
    console.group(`▶ Run Group Simulation - Group ID: ${groupId}`);
    try {
      console.log('Triggering onRunGroup with Group ID:', groupId);
      onRunGroup(groupId);
    } catch (err) {
      console.error(`❌ Error running group simulation for group ID ${groupId}:`, err);
      alert("Failed to run group simulation.");
    }
    console.groupEnd();
  };

  // --- Poll Job Status ---
  const pollJobStatus = async (jobId, groupId) => {
    try {
      const response = await getJobStatus(jobId);
      const job = response.data;

      setRefreshJobs(prev => ({
        ...prev,
        [groupId]: job
      }));

      if (job.status === 'completed') {
        setRefreshingGroups(prev => ({
          ...prev,
          [groupId]: false
        }));

        // Only show alerts for partial failures
        if (job.failed_contracts > 0) {
          alert(`❌ Refresh completed: ${job.successful_contracts} contracts updated, ${job.failed_contracts} failed.`);
        }
        // Silent success - no alert for fully successful refreshes

        // Refresh the groups data
        await fetchGroups();

      } else if (job.status === 'failed') {
        setRefreshingGroups(prev => ({
          ...prev,
          [groupId]: false
        }));
        alert(`❌ Refresh failed: ${job.error_message || 'Unknown error'}`);

      } else {
        // Still running, poll again after 2 seconds
        setTimeout(() => pollJobStatus(jobId, groupId), 2000);
      }
    } catch (err) {
      console.error(`Error polling job status:`, err);
      setRefreshingGroups(prev => ({
        ...prev,
        [groupId]: false
      }));
    }
  };

  // --- Refresh Group Contracts ---
  const handleRefreshGroup = async (groupId) => {
    console.group(`🔄 Refresh Group - Group ID: ${groupId}`);
    try {
      setRefreshingGroups(prev => ({
        ...prev,
        [groupId]: true
      }));

      const response = await refreshGroupContracts(groupId);
      const { job_id, message } = response.data;

      console.log(`✅ Started refresh job: ${message}`);

      // Start polling for job status
      pollJobStatus(job_id, groupId);

    } catch (err) {
      console.error(`❌ Error starting group refresh for group ID ${groupId}:`, err);
      setRefreshingGroups(prev => ({
        ...prev,
        [groupId]: false
      }));
      alert("Failed to start group refresh.");
    }
    console.groupEnd();
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">📂 Watchlist Groups</h3>

      <div className="space-y-4">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.id];
          console.group(`📦 Rendering Group - ID: ${group.id}`);
          console.log('Name:', group.name);
          console.log('Collapsed State:', isCollapsed);
          console.log('Contracts Count:', group.contracts.length);
          console.groupEnd();

          const isRefreshing = refreshingGroups[group.id];
          const refreshJob = refreshJobs[group.id];

          return (
            <div key={group.id} className="card card-hover">
              <div className="flex justify-between items-center mb-2">
                <button
                  onClick={() => toggleCollapse(group.id)}
                  className="flex items-center gap-2 text-primary font-bold text-lg hover:underline"
                >
                  <span className="text-green-400 text-xl leading-none">
                    {isCollapsed ? '+' : '−'}
                  </span>
                  {group.name}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefreshGroup(group.id)}
                    disabled={isRefreshing || group.contracts.length === 0}
                    className={`btn-primary text-xs ${
                      isRefreshing || group.contracts.length === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isRefreshing ? '🔄 Refreshing...' : 'Refresh Data'}
                  </button>
                  <button
                    onClick={() => handleRunGroup(group.id)}
                    disabled={isRefreshing}
                    className={`btn-primary text-xs ${
                      isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Run Group
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              {isRefreshing && refreshJob && (
                <div className="mb-2 p-2 bg-blue-900/30 rounded border border-blue-500/30">
                  <div className="text-xs text-blue-300">
                    Refreshing {refreshJob.processed_contracts || 0} of {refreshJob.total_contracts || 0} contracts
                    {refreshJob.progress_percentage ? ` (${refreshJob.progress_percentage}%)` : ''}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${refreshJob.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <>
                  {group.contracts.length > 0 ? (
                    <div className="text-sm text-muted pl-1 space-y-2">
                      {console.log(`📝 Group ${group.id} Contracts:`, group.contracts)}
                      {[...group.contracts]
                        .sort((a, b) => a.ticker.localeCompare(b.ticker))
                        .map((c) => (
                          <WatchlistContractCard
                            key={c.id}
                            contract={c}
                            isSelected={selectedContracts.includes(c.id)}
                            onSelect={(id, checked) => {
                              console.log(
                                `☑ Contract ID ${id} was ${checked ? 'selected' : 'deselected'}.`
                              );
                              if (checked) {
                                setSelectedContracts((prev) => [...prev, id]);
                              } else {
                                setSelectedContracts((prev) => prev.filter((cid) => cid !== id));
                              }
                            }}
                            onReset={handleResetDays}
                            onRefresh={handleRefresh}
                            onUpdateGroups={(id) => openAssignModalForContracts([id])}
                            onDelete={(id) => handleDeleteContract(id, group.id)}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted pl-1 italic">
                      (No contracts assigned)
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedContracts.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={handleRunSelected} className="btn-primary">Run Selected</button>
          <button onClick={handleBulkDelete} className="btn-red">Delete Selected</button>
          <button
            onClick={() => {
              console.log('Assigning selected contracts:', selectedContracts);
              openAssignModalForContracts(selectedContracts);
            }}
            className="btn-primary"
          >
            Assign Selected to Groups
          </button>
        </div>
      )}

      <WatchlistAssignGroupsModal
        isOpen={assignModalVisible}
        onClose={() => {
          console.log('❌ Closing Assign Modal');
          setAssignModalVisible(false);
        }}
        groups={groups}
        fetchGroups={fetchGroups}
        contracts={contractsForAssignment}
        onAssign={async (selectedGroupIds, mode) => {
          console.group('📤 Assigning Contracts to Groups');
          console.log('Selected Groups:', selectedGroupIds);
          console.log('Contracts for Assignment:', contractsForAssignment);
          console.log('Mode:', mode);
          try {
            for (const groupId of selectedGroupIds) {
              console.log(`➡ Sending assign request to group ID: ${groupId}`);
              await apiClient.post(`/watchlist-groups/${groupId}/assign/`, {
                contract_ids: contractsForAssignment,
                mode,
              });
            }
            alert('Contracts assigned successfully!');
            setAssignModalVisible(false);
            await fetchGroups();
          } catch (error) {
            console.error('❌ Error assigning contracts to groups:', error);
            alert('Failed to assign contracts to groups.');
          }
          console.groupEnd();
        }}
      />
    </div>
  );
}

export default WatchlistGroups;
