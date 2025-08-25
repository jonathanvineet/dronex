// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeliveryEscrow {
    struct Job {
        address poster;
        address recipient;
        address feeWallet;
        address droneWallet;
        string details;
        uint256 amount;
        bool funded;
        bool completed;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;

    event JobPosted(uint256 indexed jobId, address indexed poster, string details, address recipient, address feeWallet, uint256 amount);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobCompleted(uint256 indexed jobId, address indexed recipient, address indexed feeWallet, uint256 recipientAmount, uint256 feeAmount, uint256 droneAmount);
    event DroneAssigned(uint256 indexed jobId, address indexed droneWallet);

    address public constant FEE_WALLET = 0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1;
    
    // Function to assign a drone to a job
    function assignDrone(uint256 jobId, address droneWallet) external {
        Job storage job = jobs[jobId];
        require(job.funded, "Job not funded");
        require(!job.completed, "Already completed");
        require(job.droneWallet == address(0), "Drone already assigned");
        
        job.droneWallet = droneWallet;
        emit DroneAssigned(jobId, droneWallet);
    }

    function postJob(string calldata details, address recipient) external payable returns (uint256) {
        require(msg.value > 0, "Must fund job");
        require(recipient != address(0), "Recipient cannot be zero address");
        require(recipient != msg.sender, "Recipient cannot be sender");
        require(msg.value >= 1000000000000000, "Minimum 0.001 SEI required");
        
        // Calculate expected amount with 10% drone fee
        // Note: We don't enforce the 10% drone fee here, but it's handled in the UI
        
        jobCount++;
        // Initialize with address(0) for droneWallet, will be set when assigned
        jobs[jobCount] = Job(msg.sender, recipient, FEE_WALLET, address(0), details, msg.value, true, false);
        emit JobPosted(jobCount, msg.sender, details, recipient, FEE_WALLET, msg.value);
        emit JobFunded(jobCount, msg.value);
        return jobCount;
    }

    function confirmDelivery(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(job.funded, "Job not funded");
        require(!job.completed, "Already completed");
        require(msg.sender == job.poster, "Only poster can confirm");
        job.completed = true;
        
        // Calculate distribution amounts
        uint256 recipientAmount = (job.amount * 80) / 100; // 80% to recipient
        uint256 droneAmount = (job.amount * 10) / 100;    // 10% to drone
        uint256 feeAmount = job.amount - recipientAmount - droneAmount; // 10% to fee wallet
        
        // Send to recipient
        (bool sentRecipient, ) = payable(job.recipient).call{value: recipientAmount}("");
        require(sentRecipient, "Failed to send to recipient");
        
        // Send to fee wallet
        (bool sentFee, ) = payable(job.feeWallet).call{value: feeAmount}("");
        require(sentFee, "Failed to send to fee wallet");
        
        // Send to drone wallet if assigned, otherwise send back to poster (sender)
        if (job.droneWallet != address(0)) {
            (bool sentDrone, ) = payable(job.droneWallet).call{value: droneAmount}("");
            require(sentDrone, "Failed to send to drone wallet");
        } else {
            // If no drone assigned, refund drone fee to the poster (sender)
            (bool sentRefund, ) = payable(job.poster).call{value: droneAmount}("");
            require(sentRefund, "Failed to refund sender");
        }
        
        emit JobCompleted(jobId, job.recipient, job.feeWallet, recipientAmount, feeAmount, droneAmount);
    }
}
