# Fake Pay API

The Fake Pay API is a simulated payment service designed to replicate essential functionalities of mobile payment systems like Easypaisa. This API provides endpoints for user registration, authentication, and secure financial transactions including deposits, withdrawals, and transfers. It also features OTP verification using Twilio's Verify API for WhatsApp messaging, ensuring enhanced security for transactions.

## Features

- **User Registration**: Register a new user with name, mobile number, and PIN.
- **User Authentication**: Authenticate users based on their mobile number and PIN.
- **Deposit Money**: Allow users to deposit money into their accounts.
- **Withdraw Money with OTP Verification**: Securely withdraw money with OTP verification.
- **Transfer Money with OTP Verification**: Transfer money between users with OTP verification.
- **Transaction History**: View transaction history for a user.

## Prerequisites

- Node.js (v14 or higher)
- A Twilio account with the Verify service enabled

## Environment Variables

Create a `.env` file in the root directory of your project and add the following environment variables:

