import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';
import WatchlistContractCard from './WatchlistContractCard';
import apiClient, {
  simulateGroupContracts, // ✅ Only used for running group simulations
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

                <button
                  onClick={() => handleRunGroup(group.id)}
                  className="btn-primary text-xs"
                >
                  Run Group
                </button>
              </div>

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
