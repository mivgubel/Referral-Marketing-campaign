// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title Marketing referral contract.
/// @author @Mike_Bello90.
/// @notice You can use this contract for a marketing referral strategy.
/// @dev The wallet of the busines is set as owner of the contract in the constructor.
contract Referral {
    /// @dev using constant to reduce gas cost.
    uint256 constant FEE_PER_USER = 0.25 ether;
    uint256 constant FEE_PER_LEVEL = 0.05 ether;
    uint8 constant MAX_REFERED_USERS_PER_LEVEL = 9;
    uint8 constant MAX_LEVELS = 10;

    /// @dev grouping types and using uint8 to reduce gas cost.
    struct User {
        string name;
        uint8 level;
        uint8 num_Referidos_PerLevel;
        address wallet_Referidor;
    }
    address public owner;
    // mapping to link a wallet with the user register
    mapping(address => User) public wallet_to_User;
    // mapping to link the wallet to its earned fees
    mapping(address => uint256) public Fees_Balances_Per_Wallet;

    // Event to confirm the user was register successfully
    event RegisterSuccessfully(string name, address walletUser);
    // Event to confirm the user update his level
    event levelUp(string name, address wallet);

    constructor() {
        // Setting the wallet of the business as owner of the contract
        owner = msg.sender;
    }

    // Function to register the user
    function RegisterUser(string memory _name, address _wallet_referidor)
        public
        payable
    {
        User storage referidor = wallet_to_User[_wallet_referidor];
        User storage newUser = wallet_to_User[msg.sender];
        // validations
        require(msg.value == FEE_PER_USER, "Fee insuficiente");
        require(
            referidor.num_Referidos_PerLevel < MAX_REFERED_USERS_PER_LEVEL,
            "El usuario referidor alcanzo el maximo de referidos en este nivel"
        );
        require(
            referidor.level <= MAX_LEVELS,
            "El usuario referidor ha completado los niveles disponibles"
        );
        // Register User
        newUser.name = _name;
        newUser.level = 1;
        newUser.num_Referidos_PerLevel = 0;
        newUser.wallet_Referidor = _wallet_referidor;

        // update the number of referred users to the referring user
        referidor.num_Referidos_PerLevel += 1;

        // calculate and split the fees
        CalculateFees(_wallet_referidor);

        // Emit the event RegisterSuccessfully
        emit RegisterSuccessfully(newUser.name, msg.sender);
    }

    // Function to level up the user
    function LevelUp() public payable {
        require(msg.value == FEE_PER_LEVEL, "Fee Insuficiente");
        User storage user = wallet_to_User[msg.sender];
        user.num_Referidos_PerLevel = 9; // usado solo para testear que el requiere que valida el nivel y el resto de la funcion trabaja correctamente.
        require(
            user.num_Referidos_PerLevel == MAX_REFERED_USERS_PER_LEVEL,
            "Aun hay Spots disponibles para tu actual nivel"
        );
        require(
            user.level < MAX_LEVELS,
            "Ya has usado todos tus spots de referidos disponibles"
        );
        // Setting the fee to the business wallet / owner
        Fees_Balances_Per_Wallet[owner] += msg.value;
        // Updating user level and number of spots available
        user.level += 1;
        user.num_Referidos_PerLevel = 0;
        //emiting the event
        emit levelUp(user.name, msg.sender);
    }

    // Function to calulate and split the fees
    function CalculateFees(address _walletReferidor) private {
        // valite if num_Referidos_PerLevel es el 3°, 6°, 9°
        bool is_Third_User = wallet_to_User[_walletReferidor]
            .num_Referidos_PerLevel %
            3 ==
            0
            ? true
            : false;

        if (is_Third_User) {
            // uint256 feeForThirdUser = (FEE_PER_USER * 50) / 100;  evitamos computacion en la blockchain para salvar gas
            Fees_Balances_Per_Wallet[_walletReferidor] += 0.125 ether;
            Fees_Balances_Per_Wallet[owner] += 0.125 ether;
        } else {
            // uint256 feeForUsers = (FEE_PER_USER * 70) / 100;
            Fees_Balances_Per_Wallet[_walletReferidor] += 0.175 ether;
            Fees_Balances_Per_Wallet[owner] += 0.075 ether;
        }
    }
}
