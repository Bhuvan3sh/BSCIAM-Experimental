// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BSCIAMToken.sol";

contract BSCIAMAuth is ReentrancyGuard, Ownable, Pausable {
    struct UserProfile {
        address walletAddress;
        string username;
        string email;
        uint256 registrationTime;
        bool isActive;
        uint256 reputationScore;
        string[] accessRoles;
    }
    
    struct AccessRequest {
        address requester;
        string resource;
        string action;
        uint256 timestamp;
        bool isApproved;
        bool isProcessed;
    }
    
    BSCIAMToken public bsciamToken;
    
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public registeredUsers;
    mapping(string => address) public usernameToAddress;
    mapping(address => AccessRequest[]) public userAccessRequests;
    mapping(address => bool) public authorizedResources;
    
    uint256 public constant REGISTRATION_FEE = 10 * 10**18; // 10 BSCIAM tokens
    uint256 public constant REPUTATION_REWARD = 5 * 10**18; // 5 BSCIAM tokens for good behavior
    
    event UserRegistered(address indexed user, string username, string email);
    event AccessRequested(address indexed user, string resource, string action, uint256 requestId);
    event AccessGranted(address indexed user, string resource, string action);
    event AccessDenied(address indexed user, string resource, string action);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event ResourceAuthorized(address indexed resource, address indexed owner);
    
    constructor(address _tokenAddress) Ownable(msg.sender) {
        bsciamToken = BSCIAMToken(_tokenAddress);
    }
    
    modifier onlyRegisteredUser() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyValidUsername(string memory _username) {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(usernameToAddress[_username] == address(0), "Username already taken");
        _;
    }
    
    function registerUser(
        string memory _username,
        string memory _email
    ) external nonReentrant whenNotPaused onlyValidUsername(_username) {
        require(!registeredUsers[msg.sender], "User already registered");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        // Check if user has enough tokens for registration
        require(
            bsciamToken.balanceOf(msg.sender) >= REGISTRATION_FEE,
            "Insufficient BSCIAM tokens for registration"
        );
        
        // Transfer registration fee
        bsciamToken.transferFrom(msg.sender, address(this), REGISTRATION_FEE);
        
        // Create user profile
        userProfiles[msg.sender] = UserProfile({
            walletAddress: msg.sender,
            username: _username,
            email: _email,
            registrationTime: block.timestamp,
            isActive: true,
            reputationScore: 100, // Starting reputation score
            accessRoles: new string[](0)
        });
        
        registeredUsers[msg.sender] = true;
        usernameToAddress[_username] = msg.sender;
        
        emit UserRegistered(msg.sender, _username, _email);
    }
    
    function requestAccess(
        string memory _resource,
        string memory _action
    ) external onlyRegisteredUser whenNotPaused {
        require(userProfiles[msg.sender].isActive, "User account is inactive");
        require(bytes(_resource).length > 0, "Resource cannot be empty");
        require(bytes(_action).length > 0, "Action cannot be empty");
        
        uint256 requestId = userAccessRequests[msg.sender].length;
        
        userAccessRequests[msg.sender].push(AccessRequest({
            requester: msg.sender,
            resource: _resource,
            action: _action,
            timestamp: block.timestamp,
            isApproved: false,
            isProcessed: false
        }));
        
        emit AccessRequested(msg.sender, _resource, _action, requestId);
    }
    
    function approveAccess(
        address _user,
        uint256 _requestId,
        bool _approved
    ) external onlyOwner {
        require(_requestId < userAccessRequests[_user].length, "Invalid request ID");
        
        AccessRequest storage request = userAccessRequests[_user][_requestId];
        require(!request.isProcessed, "Request already processed");
        
        request.isProcessed = true;
        request.isApproved = _approved;
        
        if (_approved) {
            emit AccessGranted(_user, request.resource, request.action);
            // Reward user with reputation points and tokens
            _updateReputation(_user, 10);
        } else {
            emit AccessDenied(_user, request.resource, request.action);
        }
    }
    
    function updateReputation(address _user, uint256 _scoreChange) external onlyOwner {
        _updateReputation(_user, _scoreChange);
    }
    
    function _updateReputation(address _user, uint256 _scoreChange) internal {
        require(registeredUsers[_user], "User not registered");
        
        UserProfile storage user = userProfiles[_user];
        user.reputationScore += _scoreChange;
        
        // Reward user with tokens for positive reputation changes
        if (_scoreChange > 0 && bsciamToken.balanceOf(address(this)) >= REPUTATION_REWARD) {
            bsciamToken.transfer(_user, REPUTATION_REWARD);
        }
        
        emit ReputationUpdated(_user, user.reputationScore);
    }
    
    function addAccessRole(address _user, string memory _role) external onlyOwner {
        require(registeredUsers[_user], "User not registered");
        userProfiles[_user].accessRoles.push(_role);
    }
    
    function removeAccessRole(address _user, uint256 _roleIndex) external onlyOwner {
        require(registeredUsers[_user], "User not registered");
        require(_roleIndex < userProfiles[_user].accessRoles.length, "Invalid role index");
        
        string[] storage roles = userProfiles[_user].accessRoles;
        roles[_roleIndex] = roles[roles.length - 1];
        roles.pop();
    }
    
    function deactivateUser(address _user) external onlyOwner {
        require(registeredUsers[_user], "User not registered");
        userProfiles[_user].isActive = false;
    }
    
    function activateUser(address _user) external onlyOwner {
        require(registeredUsers[_user], "User not registered");
        userProfiles[_user].isActive = true;
    }
    
    function authorizeResource(address _resource) external onlyOwner {
        authorizedResources[_resource] = true;
        emit ResourceAuthorized(_resource, msg.sender);
    }
    
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        require(registeredUsers[_user], "User not registered");
        return userProfiles[_user];
    }
    
    function getUserAccessRequests(address _user) external view returns (AccessRequest[] memory) {
        return userAccessRequests[_user];
    }
    
    function getAccessRequest(address _user, uint256 _requestId) external view returns (AccessRequest memory) {
        require(_requestId < userAccessRequests[_user].length, "Invalid request ID");
        return userAccessRequests[_user][_requestId];
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawTokens() external onlyOwner {
        uint256 balance = bsciamToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        bsciamToken.transfer(owner(), balance);
    }
}
